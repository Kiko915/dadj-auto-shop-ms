import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import prisma from '../db.js';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @description Authenticates a user by verifying credentials and issues a JWT.
 * @access Public
 * @body {string} email - User's Email
 * @body {string} password - User's Password
 * @returns {object} 200 - On success, returns a success message and the JWT.
 * @returns {object} 400 - If Email and Password are not provided
 * @returns {object} 401 - If credentials are invalid (user not found or password mismatch)
 * @returns {object} 500 - If an internal server error occurs
 * Implemented by Aron Ogayon
 */
router.post('/login', async (req, res) => {
    try {
        // 1. Validate email and password
        const { email, password } = req.body

        // Validate Input
        if (!email || !password) {
            return res.status(400).json({message: 'Email and Password are required'});
        }
        
        // 2. Check user exists in database
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Check if the user exist
        if (!user) {
            return res.status(401).json({message: 'Invalid Email or Password'});
        }
        
        // 3. Verify password hash
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({message: 'Invalid Email or Password'});
        }

        // 4. Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
        )

        // 5. Return user data and token
        res.status(200).json({
            message: 'Login Success',
            token: token,
            user: {
                email: user.email,
                role: user.role,
                name: user.name,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
                region: user.region,
                province: user.province,
                city: user.city,
                barangay: user.barangay,
                street: user.street,
                country: user.country
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

/**
 * @route POST /api/auth/logout
 * @description Logout user and invalidate token
 * @access Private (requires valid JWT)
 * @headers {string} Authorization - Bearer token
 * @returns {object} 200 - Success message
 * @returns {object} 401 - If token is invalid or missing
 * @returns {object} 500 - If an internal server error occurs
 * Implemented by Aron Ogayon
 */
router.post('/logout', async (req, res) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                message: 'No token provided' 
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // In a production app, you would:
        // 1. Add token to blacklist/revoked tokens table
        // 2. Log the logout event
        // 3. Update user's last logout time
        
        // For now, we'll just verify the token and send success
        // TODO: Implement token blacklisting in production
        
        res.status(200).json({
            message: 'Logout successful',
            userId: decoded.userId
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired' 
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

/**
 * @route POST /api/auth/forgot-password
 * @description Send password reset email
 * @access Public
 * @body {string} email - User's email address
 * @returns {object} 200 - Success message when reset email is sent
 * @returns {object} 400 - If email is not provided
 * @returns {object} 404 - If email is not found in the system
 * @returns {object} 500 - If an internal server error occurs
 * Implemented by Francis Mistica
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Validate email input
        if (!email) {
            return res.status(400).json({
                message: 'Email is required'
            });
        }

        // 2. Check if user exists
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                message: 'No account found with this email address'
            });
        }

        // 3. Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // 4. Save reset token to database
        await prisma.passwordReset.create({
            data: {
                email: user.email,
                token: resetToken,
                expiresAt: expiresAt,
                used: false
            }
        });

        // 5. Setup email transporter (using Gmail as example)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASSWORD || 'your-app-password'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // 6. Email content
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@dadjauto.shop',
            to: user.email,
            subject: 'Password Reset Request - DADJ Auto Shop MS',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; padding: 20px; background-color: white;">
                        <img src="https://i.ibb.co/997jkKZB/symbol-w-wordmark-primary.png" 
                             alt="DADJ Auto Shop" 
                             style="height: 60px; width: auto; margin-bottom: 10px;" />
                    </div>
                    
                    <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                        <h3 style="color: #333;">Password Reset Request</h3>
                        
                        <p>Hello ${user.name || user.email || 'User'},</p>
                        
                        <p>We received a request to reset your password for your DADJ Auto Shop account.</p>
                        
                        <p>Click the button below to reset your password:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #000080; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            Or copy and paste this link in your browser:<br>
                            <a href="${resetUrl}">${resetUrl}</a>
                        </p>
                        
                        <p style="color: #666; font-size: 14px;">
                            <strong>This link will expire in 1 hour.</strong>
                        </p>
                        
                        <p style="color: #666; font-size: 14px;">
                            If you didn't request this password reset, please ignore this email. 
                            Your account security will not be affected.
                        </p>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                        <p>© 2025 DADJ Auto Shop. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        // 7. Send email (with error handling for demo purposes)
        try {
            await transporter.sendMail(mailOptions);
            console.log(`Password reset email sent to: ${user.email}`);
        } catch (emailError) {
            console.warn('Email sending failed:', emailError.message);
            // For development - don't fail the request if email fails
            // In production, you might want to handle this differently
        }

        // 8. Return success response (don't reveal if email sending failed)
        res.status(200).json({
            message: 'If an account with this email exists, a password reset link has been sent.',
            success: true
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Unable to process password reset request'
        });
    }
});

/**
 * @route GET /api/auth/verify-reset-token
 * @description Verify if a password reset token is valid
 * @access Public
 * @query {string} token - Reset token to verify
 * @returns {object} 200 - Token is valid
 * @returns {object} 400 - If token is missing
 * @returns {object} 404 - If token is invalid or expired
 * @returns {object} 500 - If an internal server error occurs
 * Implemented by Francis Mistica
 */
router.get('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.query;

        // 1. Validate token input
        if (!token) {
            return res.status(400).json({
                message: 'Reset token is required'
            });
        }

        // 2. Find token in database
        const resetRecord = await prisma.passwordReset.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!resetRecord) {
            return res.status(404).json({
                message: 'Invalid reset token'
            });
        }

        // 3. Check if token is expired
        if (new Date() > resetRecord.expiresAt) {
            return res.status(404).json({
                message: 'Reset token has expired'
            });
        }

        // 4. Check if token has been used
        if (resetRecord.used) {
            return res.status(404).json({
                message: 'Reset token has already been used'
            });
        }

        // 5. Token is valid
        res.status(200).json({
            message: 'Reset token is valid',
            valid: true
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Unable to verify reset token'
        });
    }
});

/**
 * @route POST /api/auth/reset-password
 * @description Reset user password using valid token
 * @access Public
 * @body {string} token - Reset token
 * @body {string} password - New password
 * @returns {object} 200 - Password reset successfully
 * @returns {object} 400 - If token or password is missing, or password is invalid
 * @returns {object} 404 - If token is invalid or expired
 * @returns {object} 500 - If an internal server error occurs
 * Implemented by Francis Mistica
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        // 1. Validate input
        if (!token || !password) {
            return res.status(400).json({
                message: 'Reset token and new password are required'
            });
        }

        // 2. Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long'
            });
        }

        // Additional password validation
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            return res.status(400).json({
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            });
        }

        // 3. Find and validate token
        const resetRecord = await prisma.passwordReset.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!resetRecord) {
            return res.status(404).json({
                message: 'Invalid reset token'
            });
        }

        // 4. Check if token is expired
        if (new Date() > resetRecord.expiresAt) {
            return res.status(404).json({
                message: 'Reset token has expired'
            });
        }

        // 5. Check if token has been used
        if (resetRecord.used) {
            return res.status(404).json({
                message: 'Reset token has already been used'
            });
        }

        // 6. Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 7. Update user password and mark token as used
        await prisma.$transaction([
            // Update user password
            prisma.user.update({
                where: { email: resetRecord.email },
                data: { password: hashedPassword }
            }),
            // Mark token as used
            prisma.passwordReset.update({
                where: { token },
                data: { used: true }
            })
        ]);

        // 8. Clean up expired tokens for this user
        await prisma.passwordReset.deleteMany({
            where: {
                email: resetRecord.email,
                expiresAt: { lt: new Date() }
            }
        });

        console.log(`Password reset successful for user: ${resetRecord.email}`);

        // 9. Return success response
        res.status(200).json({
            message: 'Password reset successfully',
            success: true
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Unable to reset password'
        });
    }
});

/**
 * @route POST /api/auth/register
 * @description User registration
 * @access Public
 * TODO: Implement by team member
 */
router.post('/register', async (req, res) => {
    try {
        // TODO: Implement registration logic
        // 1. Validate input data
        // 2. Check if user already exists
        // 3. Hash password
        // 4. Create user in database
        // 5. Generate JWT token
        // 6. Return user data and token
        
        res.status(501).json({
            message: 'Registration endpoint not implemented yet',
            todo: 'Team member needs to implement user registration logic'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

export default router;