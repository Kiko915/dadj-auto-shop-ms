import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
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
 * TODO: Implement by Aron Ogayon
 */
router.post('/login', async (req, res) => {
    try {
        // TODO: Implement login logic
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
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

/**
 * @route POST /api/auth/forgot-password
 * @description Send password reset email
 * @access Public
 * TODO: Implement by team member
 */
router.post('/forgot-password', async (req, res) => {
    try {
        // TODO: Implement forgot password logic
        // 1. Validate email
        // 2. Check if user exists
        // 3. Generate reset token
        // 4. Send email with reset link
        // 5. Return success message
        
        res.status(501).json({
            message: 'Forgot password endpoint not implemented yet',
            todo: 'Team member needs to implement password reset logic'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
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