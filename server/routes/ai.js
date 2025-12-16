import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Gemini
// Ensure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

        // Construct a concise prompt
        const prompt = `
        Act as a Business Consultant for an Auto Shop. 
        Here is the live data:
        - Revenue Today: ${stats.revenueToday}
        - Active Jobs: ${stats.activeJobs}
        - Pending Estimates: ${stats.pendingEstimates}
        - Low Stock Items Count: ${stats.lowStockCount}
        - Specific Low Stock Items: ${stats.lowStockItems ? stats.lowStockItems.map(i => `${i.name} (${i.quantity})`).join(', ') : 'None'}
        - Urgent Jobs Due: ${urgentJobs ? urgentJobs.length : 0}

        Write a concise, 3-sentence summary.
        1. First sentence: Assess financial performance (Good/Low).
        2. Second sentence: Highlight the most urgent operational risk (Low stock or Overdue jobs).
        3. Third sentence: Give one specific recommendation.
        
        Keep it professional, direct, and under 60 words.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ insight: text });

    } catch (error) {
        console.error('AI Insight Error:', error);
        res.status(500).json({
            error: 'Failed to generate insight',
            details: error.message
        });
    }
});

export default router;
