// routes/protected.js - Protected API routes
import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';

const router = express.Router();

/**
 * @route GET /api/protected/profile
 * @description Get current user profile
 * @access Private (any authenticated user)
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve profile',
      error: 'PROFILE_ERROR' 
    });
  }
});

/**
 * @route GET /api/protected/users
 * @description Get all users (admin only)
 * @access Private (admin role required)
 */
router.get('/users', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      message: 'Users retrieved successfully',
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve users',
      error: 'USERS_ERROR' 
    });
  }
});

/**
 * @route GET /api/protected/dashboard-stats
 * @description Get dashboard statistics
 * @access Private (staff and admin)
 */
router.get('/dashboard-stats', authenticateToken, authorizeRoles(['STAFF', 'admin']), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    
    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      currentUser: req.user
    };

    res.json({
      message: 'Dashboard stats retrieved successfully',
      stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve dashboard stats',
      error: 'STATS_ERROR' 
    });
  }
});

export default router;