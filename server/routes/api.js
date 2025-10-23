import express from 'express';
// Import the Prisma client initialized in db.js
import prisma from '../db.js'; 
import { authenticateToken } from '../middleware/auth.js';

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

/**
 * @route PATCH /api/user/profile
 * @description Update user profile information
 * @access Private (requires valid JWT)
 * @body {string} name - User's full name
 * @body {string} region - Region name
 * @body {string} province - Province name
 * @body {string} city - City/Municipality name
 * @body {string} barangay - Barangay name
 * @body {string} street - Street address
 * @returns {object} 200 - Updated user data
 * @returns {object} 400 - Validation errors
 * @returns {object} 401 - Unauthorized
 * @returns {object} 404 - User not found
 * @returns {object} 500 - Internal server error
 */
router.patch('/user/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware (user object has 'id' not 'userId')
        const { name, region, province, city, barangay, street } = req.body;

        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                error: 'Name is required'
            });
        }

        if (name.trim().length < 2) {
            return res.status(400).json({
                error: 'Name must be at least 2 characters long'
            });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name.trim(),
                region: region?.trim() || null,
                province: province?.trim() || null,
                city: city?.trim() || null,
                barangay: barangay?.trim() || null,
                street: street?.trim() || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                profilePicture: true,
                region: true,
                province: true,
                city: true,
                barangay: true,
                street: true,
                country: true,
                createdAt: true,
            }
        });

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            error: 'Failed to update profile'
        });
    }
});

// Export the router using ES6 syntax
export default router;