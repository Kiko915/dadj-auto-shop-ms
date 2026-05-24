import express from 'express';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null
console.log('[AI] Groq client:', groqClient ? 'READY' : 'NOT READY');

// Log every request that hits this router
router.use((req, res, next) => {
  console.log(`[AI router] ${req.method} ${req.path} | auth header: ${req.headers.authorization ? 'present' : 'MISSING'}`)
  next()
})

/**
 * @route POST /api/ai/insight
 * @description Generate an executive summary based on shop stats
 * @access Private
 */
router.post('/insight', authenticateToken, async (req, res) => {
    try {
        const { stats, urgentJobs } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({
                error: 'AI service unavailable (Missing API Key)'
            });
        }

        // Input Validation
        if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
            return res.status(400).json({ error: 'Invalid stats format. Expected object.' });
        }

        if (urgentJobs && !Array.isArray(urgentJobs)) {
            return res.status(400).json({ error: 'Invalid urgentJobs format. Expected array.' });
        }

        // Initialize Gemini client lazily
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Construct a concise prompt
        const prompt = `
        Act as a Business Consultant for an Auto Shop in the Philippines.
        Here is the live data:
        - Revenue Today: PHP ${Number(stats.revenueToday || 0)}
        - Active Jobs: ${Number(stats.activeJobs || 0)}
        - Pending Estimates: ${Number(stats.pendingEstimates || 0)}
        - Low Stock Items Count: ${Number(stats.lowStockCount || 0)}
        - Specific Low Stock Items: ${Array.isArray(stats.lowStockItems) && stats.lowStockItems.length > 0 ? stats.lowStockItems.map(i => `${i.name} (${i.quantity})`).join(', ') : 'None'}
        - Urgent Jobs Due: ${Array.isArray(urgentJobs) ? urgentJobs.length : 0}

        Write a concise, 3-sentence summary.
        1. First sentence: Assess financial performance (Good/Low).
        2. Second sentence: Highlight the most urgent operational risk (Low stock or Overdue jobs).
        3. Third sentence: Give one specific recommendation.
        
        Keep it professional, direct, and under 60 words. Always use "PHP" or "₱" for currency.
        `;

        // Add Timeout (10s)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI Request Timed Out')), 10000)
        );

        const requestPromise = ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        const response = await Promise.race([requestPromise, timeoutPromise]);

        // Handle text extraction safely (function vs property)
        const text = typeof response.text === 'function' ? response.text() : response.text;

        res.json({ insight: text });

    } catch (error) {
        const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        console.error(`AI Insight Error [${errorId}]:`, error);
        res.status(500).json({
            error: 'Failed to generate insight',
            errorId
        });
    }
});

/**
 * @route POST /api/ai/parse-order
 * @description Extract structured service order data from a voice transcript using Groq
 * @access Private
 */
router.post('/parse-order', authenticateToken, async (req, res) => {
    try {
        const { transcript } = req.body

        if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
            return res.status(400).json({ error: 'Transcript is required' })
        }

        console.log('[parse-order] hit, groqClient:', groqClient ? 'ready' : 'null')
        if (!groqClient) {
            return res.status(503).json({ error: 'AI service unavailable' })
        }

        const groq = groqClient

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a service order parser for a Philippine automotive repair shop.
Extract information from the user's voice transcript and return ONLY valid JSON — no explanation, no markdown, no code block.

Rules:
- customerName: full name of the customer. Empty string if not mentioned.
- vehicleDescription: vehicle make, model, and year if mentioned. Empty string if not mentioned.
- items: array of parts and labor. Use type "PART" for physical parts, "LABOR" for work/service.
- quantity: number (default 1 if not specified). For LABOR, quantity = hours if mentioned.
- price: number in PHP (default 0 if not mentioned).

Return ONLY this exact JSON shape:
{
  "customerName": "",
  "vehicleDescription": "",
  "items": [
    { "type": "PART", "name": "", "quantity": 1, "price": 0 },
    { "type": "LABOR", "name": "", "quantity": 1, "price": 0 }
  ]
}`
                },
                {
                    role: 'user',
                    content: transcript.trim()
                }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' },
        })

        const text = completion.choices[0]?.message?.content || '{}'
        const parsed = JSON.parse(text)

        res.json({ parsed })

    } catch (error) {
        console.error('Parse Order Error:', error)
        if (error instanceof SyntaxError) {
            return res.status(422).json({ error: 'AI returned unparseable response. Try again.' })
        }
        res.status(500).json({ error: 'Failed to parse voice order' })
    }
})

/**
 * @route POST /api/ai/diagnose
 * @description Analyze a customer complaint and suggest diagnoses + service items
 * @access Private
 */
router.post('/diagnose', authenticateToken, async (req, res) => {
    try {
        const { complaint, vehicleInfo } = req.body

        if (!complaint || typeof complaint !== 'string' || complaint.trim().length === 0) {
            return res.status(400).json({ error: 'Complaint description is required' })
        }

        if (!groqClient) {
            return res.status(503).json({ error: 'AI service unavailable' })
        }

        const vehicleContext = vehicleInfo ? `Vehicle: ${vehicleInfo.trim()}` : 'Vehicle: unknown'

        const completion = await groqClient.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert automotive technician and service advisor for a repair shop in the Philippines.
A customer has described a problem with their vehicle. Analyze the symptoms and return ONLY valid JSON — no explanation, no markdown, no code block.

Rules:
- diagnoses: up to 3 most likely root causes, ordered from most to least probable.
  - issue: short name of the problem (e.g. "Worn brake pads")
  - confidence: "high", "medium", or "low"
  - explanation: 1–2 sentences explaining why this matches the symptoms
- items: recommended service items to fix or investigate the issue.
  - type: "LABOR" for services/inspections, "PART" for physical components
  - name: specific service or part name
  - description: brief detail (e.g. "Front and rear" or "Per hour")
  - quantity: realistic number (hours for labor, units for parts)
  - price: estimated price in PHP based on typical Philippine auto shop rates

Return ONLY this exact JSON shape:
{
  "diagnoses": [
    { "issue": "", "confidence": "high", "explanation": "" }
  ],
  "items": [
    { "type": "LABOR", "name": "", "description": "", "quantity": 1, "price": 0 },
    { "type": "PART",  "name": "", "description": "", "quantity": 1, "price": 0 }
  ]
}`
                },
                {
                    role: 'user',
                    content: `${vehicleContext}\nCustomer complaint: ${complaint.trim()}`
                }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
        })

        const text = completion.choices[0]?.message?.content || '{}'
        const result = JSON.parse(text)

        res.json({ result })

    } catch (error) {
        console.error('Diagnose Error:', error)
        if (error instanceof SyntaxError) {
            return res.status(422).json({ error: 'AI returned unparseable response. Try again.' })
        }
        res.status(500).json({ error: 'Failed to analyze complaint' })
    }
})

export default router;
