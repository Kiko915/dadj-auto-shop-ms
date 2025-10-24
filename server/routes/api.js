import express from 'express';
// Import the Prisma client initialized in db.js
import prisma from '../db.js'; 
import { authenticateToken } from '../middleware/auth.js';
import imagekit from '../config/imagekit.js';
import bcrypt from 'bcrypt';

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

/**
 * @route GET /api/imagekit-auth
 * @description Get ImageKit authentication parameters for client-side upload
 * @access Private
 */
router.get('/imagekit-auth', authenticateToken, async (req, res) => {
    try {
        const authenticationParameters = imagekit.getAuthenticationParameters();
        res.status(200).json(authenticationParameters);
    } catch (error) {
        console.error('ImageKit auth error:', error);
        res.status(500).json({
            error: 'Failed to get ImageKit authentication parameters'
        });
    }
});

/**
 * @route PATCH /api/user/profile-picture
 * @description Update user's profile picture URL
 * @access Private
 */
router.patch('/user/profile-picture', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { profilePicture } = req.body;

        // Validate input
        if (!profilePicture) {
            return res.status(400).json({
                error: 'Profile picture URL is required'
            });
        }

        // Update user's profile picture
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePicture },
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
            message: 'Profile picture updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile picture update error:', error);
        res.status(500).json({
            error: 'Failed to update profile picture'
        });
    }
});

/**
 * @route PATCH /api/user/password
 * @description Update user password
 * @access Private
 * @body {string} currentPassword - Current password for verification
 * @body {string} newPassword - New password to set
 */
router.patch('/user/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required'
            });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return res.status(400).json({
                message: 'New password must be at least 8 characters long'
            });
        }

        // Check for password complexity
        const hasLowercase = /[a-z]/.test(newPassword);
        const hasUppercase = /[A-Z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

        if (!hasLowercase || !hasUppercase || !hasNumber) {
            return res.status(400).json({
                message: 'Password must contain uppercase, lowercase, and numbers'
            });
        }

        // Get current user with password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true }
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Current password is incorrect'
            });
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                message: 'New password must be different from current password'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.status(200).json({
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({
            message: 'Failed to update password'
        });
    }
});

/**
 * @route GET /api/user/sessions
 * @description Get all active sessions for the current user
 * @access Private (requires valid JWT)
 * @returns {object} 200 - Array of active sessions
 * @returns {object} 401 - Unauthorized
 * @returns {object} 500 - Internal server error
 */
router.get('/user/sessions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const currentToken = req.token;

        // Get all active sessions (not expired)
        const sessions = await prisma.userSession.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() }
            },
            orderBy: {
                lastActivity: 'desc'
            },
            select: {
                id: true,
                deviceInfo: true,
                browser: true,
                ipAddress: true,
                location: true,
                lastActivity: true,
                createdAt: true,
                token: true
            }
        });

        // Mark current session
        const sessionsWithStatus = sessions.map(session => ({
            ...session,
            isCurrent: session.token === currentToken,
            // Don't send token to client for security
            token: undefined
        }));

        res.status(200).json({ sessions: sessionsWithStatus });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            message: 'Failed to retrieve sessions'
        });
    }
});

/**
 * @route DELETE /api/user/sessions/:sessionId
 * @description Logout/delete a specific session
 * @access Private (requires valid JWT)
 * @param {string} sessionId - ID of the session to delete
 * @returns {object} 200 - Success message
 * @returns {object} 400 - Cannot delete current session
 * @returns {object} 401 - Unauthorized
 * @returns {object} 404 - Session not found
 * @returns {object} 500 - Internal server error
 */
router.delete('/user/sessions/:sessionId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const currentToken = req.token;
        const { sessionId } = req.params;

        // Find the session
        const session = await prisma.userSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            return res.status(404).json({
                message: 'Session not found'
            });
        }

        // Check if session belongs to user
        if (session.userId !== userId) {
            return res.status(403).json({
                message: 'Unauthorized to delete this session'
            });
        }

        // Prevent deleting current session
        if (session.token === currentToken) {
            return res.status(400).json({
                message: 'Cannot delete current session. Use logout instead.'
            });
        }

        // Delete the session
        await prisma.userSession.delete({
            where: { id: sessionId }
        });

        res.status(200).json({
            message: 'Session terminated successfully'
        });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({
            message: 'Failed to delete session'
        });
    }
});

/**
 * @route GET /api/user/export
 * @description Export user's complete data (profile, address, sessions, etc.)
 * @access Private (requires valid JWT)
 */
router.get('/user/export', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get complete user data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                profilePicture: true,
                country: true,
                region: true,
                province: true,
                city: true,
                barangay: true,
                street: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Get active sessions
        const sessions = await prisma.userSession.findMany({
            where: { 
                userId: userId,
                expiresAt: { gt: new Date() }
            },
            select: {
                id: true,
                deviceInfo: true,
                browser: true,
                ipAddress: true,
                location: true,
                lastActivity: true,
                createdAt: true,
            },
            orderBy: {
                lastActivity: 'desc'
            }
        });

        // Prepare export data
        const exportData = {
            profile: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                profilePicture: user.profilePicture,
            },
            address: {
                country: user.country,
                region: user.region,
                province: user.province,
                city: user.city,
                barangay: user.barangay,
                street: user.street,
            },
            sessions: sessions.map(session => ({
                device: session.deviceInfo,
                browser: session.browser,
                ipAddress: session.ipAddress,
                location: session.location,
                lastActivity: session.lastActivity,
                loginDate: session.createdAt,
            })),
            metadata: {
                accountCreated: user.createdAt,
                lastUpdated: user.updatedAt,
                exportDate: new Date().toISOString(),
                totalActiveSessions: sessions.length,
            }
        };

        res.status(200).json(exportData);
    } catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({
            message: 'Failed to export data'
        });
    }
});

/**
 * @route DELETE /api/user/account
 * @description Delete user account (requires password and confirmation word)
 * @access Private (requires valid JWT) - Admins cannot delete their own accounts
 */
router.delete('/user/account', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { password, confirmationWord, providedWord } = req.body;

        // Validation
        if (!password || !confirmationWord || !providedWord) {
            return res.status(400).json({
                message: 'Password, confirmation word, and provided word are required'
            });
        }

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                password: true,
            }
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Check if user is an admin
        if (user.role === 'admin') {
            return res.status(403).json({
                error: 'ADMIN_DELETE_RESTRICTED',
                message: 'Admin accounts cannot be self-deleted. Please contact the developers for account deletion.',
                supportEmail: 'synera.swe@gmail.com'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'INVALID_PASSWORD',
                message: 'Incorrect password'
            });
        }

        // Verify confirmation word
        if (confirmationWord !== providedWord) {
            return res.status(400).json({
                error: 'INVALID_CONFIRMATION',
                message: 'Confirmation word does not match'
            });
        }

        // Delete all user sessions first
        await prisma.userSession.deleteMany({
            where: { userId: userId }
        });

        // Delete the user account
        await prisma.user.delete({
            where: { id: userId }
        });

        console.log(`Account deleted for user: ${user.email} (${user.name})`);

        res.status(200).json({
            message: 'Account successfully deleted',
            deletedUser: {
                email: user.email,
                name: user.name,
                deletedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            message: 'Failed to delete account'
        });
    }
});

// Export the router using ES6 syntax
export default router;