// middleware/auth.js - JWT Authentication Middleware
import jwt from 'jsonwebtoken';
import prisma from '../db.js';

/**
 * Middleware to verify JWT token and authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'NO_TOKEN'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optional: Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'User not found or inactive',
        error: 'INVALID_USER'
      });
    }

    // Add user info to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'EXPIRED_TOKEN'
      });
    }
    
    return res.status(500).json({ 
      message: 'Authentication failed',
      error: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to check user roles
 * @param {Array|String} allowedRoles - Roles that can access the route
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'NO_AUTH'
      });
    }

    // Convert single role to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_ROLE',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Optional middleware - Extract user info if token present (non-blocking)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, isActive: true }
      });

      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }
  
  next();
};