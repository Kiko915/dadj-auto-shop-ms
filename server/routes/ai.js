import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Gemini
// Ensure GEMINI_API_KEY is in your .env file
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 

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

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        // The new SDK returns response.text as a property/getter
        res.json({ insight: response.text });

    } catch (error) {
        const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        console.error(`AI Insight Error [${errorId}]:`, error);
        res.status(500).json({
            error: 'Failed to generate insight',
            errorId
        });
    }
});

export default router;
