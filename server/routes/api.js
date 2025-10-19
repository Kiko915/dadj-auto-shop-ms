import express from 'express';
// Import the Prisma client initialized in db.js
import prisma from '../db.js'; 

const router = express.Router();
    
/**
 * @route GET /api/test-connection
 * @description Full-stack health check: Express -> Prisma -> NeonDB -> Return.
 * This creates a dummy user and retrieves all users to confirm R/W access.
 */
router.get('/test-connection', async (req, res) => {
    try {
        // 1. Create a dummy record in NeonDB
        const testEmail = `testuser_${Date.now()}@example.com`;
        await prisma.user.create({
            data: {
                email: testEmail,
                name: 'Smoke Test User',
            },
        });

        // 2. Retrieve all records to confirm read access
        const users = await prisma.user.findMany();

        res.json({
            status: 'OK',
            database: 'Connected to NeonDB via Prisma',
            userCount: users.length,
            message: `Successfully created and retrieved ${users.length} users.`,
        });
    } catch (error) {
        // Log the detailed error on the server side
        console.error("Health Check Failed. Check NeonDB credentials/connection string:", error.message);
        
        // Return a generic error to the client
        res.status(500).json({ 
            status: 'ERROR', 
            error: "Server or Database connection failed. See server console for details." 
        });
    }
});

// Export the router using ES6 syntax
export default router;