import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import prisma from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import imagekit from '../config/imagekit.js';

const router = express.Router();

router.get('/mechanics', authenticateToken, authorizeRoles(['admin', 'staff']), async (req, res) => {
    try {
        const mechanics = await prisma.user.findMany({
            where: {
                role: 'mechanic',
                isActive: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true
            }
        });
        res.json(mechanics);
    } catch (error) {
        console.error('Get Mechanics Error:', error);
        res.status(500).json({ message: 'Failed to fetch mechanics' });
    }
});

/**
 * @route GET /api/users
 * @description Get all users with pagination, search, and filtering
 * @access Admin only
 * @query {number} page - Page number (default 1)
 * @query {number} pageSize - Page size (default 10)
 * @query {string} search - Search term (name or email)
 * @query {string} role - Filter by role (admin, staff, mechanic)
 * @query {string} status - Filter by status (active: true/false)
 */
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const {
            page,
            pageSize,
            search = '',
            role = 'All',
            status = 'All'
        } = req.query;

        // Validate page
        let pageNum = 1;
        if (page !== undefined) {
            const parsedPage = parseInt(page, 10);
            if (isNaN(parsedPage) || parsedPage < 1) {
                return res.status(400).json({ error: 'Invalid pagination parameters: page must be a positive integer' });
            }
            pageNum = parsedPage;
        }

        // Validate pageSize
        let size = 10;
        if (pageSize !== undefined) {
            const parsedSize = parseInt(pageSize, 10);
            if (isNaN(parsedSize) || parsedSize < 1) {
                return res.status(400).json({ error: 'Invalid pagination parameters: pageSize must be a positive integer' });
            }
            size = Math.min(parsedSize, 100); // Clamp max size to 100
        }

        const skip = (pageNum - 1) * size;

        // Build filter conditions
        const where = {};

        // Search filter (name or email)
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Role filter
        if (role && role !== 'All') {
            where.role = role;
        }

        // Status filter
        if (status && status !== 'All') {
            where.isActive = status === 'active';
        }

        // Get total count
        const total = await prisma.user.count({ where });

        // Get users
        const users = await prisma.user.findMany({
            where,
            skip,
            take: size,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                profilePicture: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        // Get role counts for stats
        const roleCounts = await prisma.user.groupBy({
            by: ['role'],
            _count: { role: true }
        });

        const activeCount = await prisma.user.count({ where: { isActive: true } });
        const inactiveCount = await prisma.user.count({ where: { isActive: false } });

        res.status(200).json({
            users,
            meta: {
                total,
                page: pageNum,
                pageSize: size,
                totalPages: Math.ceil(total / size),
            },
            stats: {
                roleCounts: roleCounts.reduce((acc, item) => {
                    acc[item.role] = item._count.role;
                    return acc;
                }, {}),
                activeCount,
                inactiveCount,
                totalCount: total
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            error: 'Failed to fetch users',
            message: error.message
        });
    }
});

/**
 * @route GET /api/users/:id
 * @description Get a single user by ID
 * @access Admin only
 */
router.get('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                profilePicture: true,
                region: true,
                province: true,
                city: true,
                barangay: true,
                street: true,
                country: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Failed to fetch user',
            message: error.message
        });
    }
});


/**
 * @route POST /api/users
 * @description Create a new user with auto-generated password sent via email
 * @access Admin only
 * @body {string} email - User's email (required)
 * @body {string} name - User's full name (required)
 * @body {string} role - User's role: admin, staff, mechanic (required)
 * @body {boolean} isActive - Whether user is active (optional, default true)
 * @body {string} profilePicture - Profile picture URL (optional)
 */
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { email, name, role, isActive = true, profilePicture } = req.body;

        // Validation - Password is no longer required from client
        if (!email || !name || !role) {
            return res.status(400).json({
                error: 'Email, name, and role are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        // Validate role
        const validRoles = ['admin', 'staff', 'mechanic'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'A user with this email already exists'
            });
        }

        // Generate Secure Random Password (12 chars, alphanumeric)
        const password = crypto.randomBytes(8).toString('hex').slice(0, 12);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user (moved before email to prevent timeout blocking)
        const newUser = await prisma.user.create({
            data: {
                email: email.toLowerCase().trim(),
                name: name.trim(),
                password: hashedPassword,
                role,
                isActive,
                profilePicture: profilePicture || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                profilePicture: true,
                createdAt: true,
            }
        });

        console.log(`New user created by admin: ${newUser.email} (${newUser.role})`);

        // Send Email with wrapper and AWAIT it
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.replace(/\s+/g, '') : ''
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 60000,
            socketTimeout: 60000
        });

        // Use origin for dynamic fallback if CLIENT_URL is not set
        const appUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
        const loginUrl = `${appUrl}/auth/login`;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@dadjauto.shop',
            to: email,
            subject: 'Welcome to DADJ Auto Shop - Your Account Details',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; padding: 20px; background-color: white;">
                        <img src="https://i.ibb.co/997jkKZB/symbol-w-wordmark-primary.png" 
                             alt="DADJ Auto Shop" 
                             style="height: 60px; width: auto; margin-bottom: 10px;" />
                    </div>
                     
                    <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                        <h3 style="color: #333;">Welcome to DADJ Auto Shop!</h3>
                        
                        <p>Hello ${name},</p>
                        
                        <p>An account has been created for you in the DADJ Auto Shop Management System.</p>
                        
                        <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #ddd; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                            <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background-color: #eee; padding: 2px 6px; border-radius: 4px; font-size: 1.1em;">${password}</code></p>
                        </div>
                        
                        <p>Please login using these credentials and change your password immediately after your first login.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${loginUrl}" 
                               style="background-color: #000080; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block;">
                                Login to Dashboard
                            </a>
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                        <p>© 2025 DADJ Auto Shop. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        // NON-BLOCKING: Send in background
        new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Welcome email failed:', err);
                    reject(err);
                } else {
                    console.log(`Welcome email sent to: ${email}`);
                    resolve(info);
                }
            });
        }).catch(err => console.error('CRITICAL: Failed to send welcome email', err));

        // Return success response immediately
        res.status(201).json({
            message: 'User created successfully. A welcome email with the password is being sent.',
            user: newUser
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            error: 'Failed to create user',
            message: error.message
        });
    }
});

/**
 * @route PUT /api/users/:id
 * @description Update an existing user
 * @access Admin only
 */
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { email, name, password, role, isActive, profilePicture } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Prevent admin from deactivating themselves
        if (isActive === false && String(id) === String(req.user.id)) {
            return res.status(400).json({
                error: 'You cannot deactivate your own account'
            });
        }

        // Validate role if provided
        if (role) {
            const validRoles = ['admin', 'staff', 'mechanic'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
                });
            }
        }

        // Validate email if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Invalid email format'
                });
            }

            // Check if email is taken by another user
            const emailTaken = await prisma.user.findFirst({
                where: {
                    email: email.toLowerCase().trim(),
                    NOT: { id }
                }
            });

            if (emailTaken) {
                return res.status(409).json({
                    error: 'This email is already in use by another user'
                });
            }
        }

        // Build update data
        const updateData = {};

        if (email) updateData.email = email.toLowerCase().trim();
        if (name) updateData.name = name.trim();
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

        // Handle password update
        if (password) {
            if (password.length < 8) {
                return res.status(400).json({
                    error: 'Password must be at least 8 characters long'
                });
            }

            const hasLowercase = /[a-z]/.test(password);
            const hasUppercase = /[A-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);

            if (!hasLowercase || !hasUppercase || !hasNumber) {
                return res.status(400).json({
                    error: 'Password must contain uppercase, lowercase, and numbers'
                });
            }

            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                profilePicture: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        console.log(`User updated by admin: ${updatedUser.email}`);

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            error: 'Failed to update user',
            message: error.message
        });
    }
});

/**
 * @route DELETE /api/users/:id
 * @description Deactivate a user (soft delete)
 * @access Admin only
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        // Prevent admin from deactivating themselves
        if (String(id) === String(adminId)) {
            return res.status(400).json({
                error: 'You cannot deactivate your own account'
            });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Soft delete - deactivate user
        const deactivatedUser = await prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
            }
        });

        // Delete all active sessions for this user
        await prisma.userSession.deleteMany({
            where: { userId: id }
        });

        console.log(`User deactivated by admin: ${deactivatedUser.email}`);

        res.status(200).json({
            message: 'User deactivated successfully',
            user: deactivatedUser
        });
    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({
            error: 'Failed to deactivate user',
            message: error.message
        });
    }
});

/**
 * @route PATCH /api/users/:id/activate
 * @description Reactivate a deactivated user
 * @access Admin only
 */
router.patch('/:id/activate', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        if (user.isActive) {
            return res.status(400).json({
                error: 'User is already active'
            });
        }

        // Reactivate user
        const activatedUser = await prisma.user.update({
            where: { id },
            data: { isActive: true },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
            }
        });

        console.log(`User reactivated by admin: ${activatedUser.email}`);

        res.status(200).json({
            message: 'User activated successfully',
            user: activatedUser
        });
    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({
            error: 'Failed to activate user',
            message: error.message
        });
    }
});


/**
 * @route DELETE /api/users/:id/hard
 * @description Permanently delete a user (Hard delete)
 * @access Admin only
 */
router.delete('/:id/hard', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        // Prevent admin from deleting themselves
        if (String(id) === String(adminId)) {
            return res.status(400).json({
                error: 'You cannot delete your own account'
            });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Hard delete - delete user and all related data
        // First delete manually handled relations if needed, e.g. sessions
        await prisma.userSession.deleteMany({ where: { userId: id } });
        await prisma.passwordReset.deleteMany({ where: { userId: id } });

        const deletedUser = await prisma.user.delete({
            where: { id }
        });

        console.log(`User PERMANENTLY deleted by admin: ${deletedUser.email}`);

        res.status(200).json({
            message: 'User permanently deleted successfully',
            user: deletedUser
        });
    } catch (error) {
        console.error('Hard delete user error:', error);
        if (error.code === 'P2003') {
            return res.status(400).json({
                error: 'Cannot delete user because they have associated records (e.g. Orders, Estimates). Deactivate them instead.'
            });
        }
        res.status(500).json({
            error: 'Failed to delete user',
            message: error.message
        });
    }
});

export default router;
