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
    const { timeRange = '7days' } = req.query;

    // Calculate Filtering Query Dates
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (timeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'thisMonth':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'lastMonth':
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(); // Start of this month
        endDate.setDate(1);
        endDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Standard "Today" start
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Run queries in parallel
    const [
      activeJobsCount,
      todaysSalesAgg,
      lowInventoryCount,
      lowInventoryItems,
      pendingApprovalsCount,
      dueTodayOrders,
      revenueTrend,
      // activeBaysCount removed (redundant)
      totalUsers,
      topPartsRaw,
      orderStatusRaw
    ] = await Promise.all([
      // 1. Snapshot: Active Jobs
      prisma.serviceOrder.count({ where: { status: 'IN_PROGRESS' } }),

      // 2. Snapshot: Today's Sales
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { date: { gte: todayStart } }
      }),

      // 3. Snapshot: Low Inventory (Count)
      prisma.inventoryItem.count({ where: { quantity: { lte: 5 } } }),

      // 4. Low Inventory Items (Details)
      prisma.inventoryItem.findMany({
        where: { quantity: { lte: 5 } },
        select: { name: true, quantity: true },
        take: 3
      }),

      // 5. Snapshot: Pending Approvals
      prisma.estimate.count({ where: { status: 'PENDING' } }),

      // 6. Widget: Due Today
      prisma.serviceOrder.findMany({
        where: {
          estimatedCompletion: {
            gte: todayStart,
            lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
          },
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
        },
        include: {
          customer: { select: { firstName: true, lastName: true } },
          vehicle: { select: { make: true, model: true, licensePlate: true } }
        },
        orderBy: { estimatedCompletion: 'asc' },
        take: 5
      }),

      // 7. Widget: Revenue Trend
      prisma.payment.findMany({
        where: { date: { gte: sevenDaysAgo } },
        select: { date: true, amount: true },
        orderBy: { date: 'asc' }
      }),

      // 8. Snapshot: Shop Capacity (REMOVED - Redundant with activeJobs)
      // prisma.serviceOrder.count({ where: { status: 'IN_PROGRESS' } }),

      // 8. User stats
      prisma.user.count(),

      // 9. Filtered Chart 1: Top Moving Parts
      prisma.$queryRaw`
        SELECT i.name, SUM(soi.quantity) as total_quantity
        FROM service_order_items soi
        JOIN service_orders so ON soi.order_id = so.order_id
        LEFT JOIN inventory_items i ON soi.inventory_item_id = i.id
        WHERE so.created_at >= ${startDate}
        AND so.created_at < ${endDate}
        AND soi.inventory_item_id IS NOT NULL
        GROUP BY i.name
        ORDER BY total_quantity DESC
        LIMIT 5
      `,

      // 10. Filtered Chart 2: Order Status Distribution
      prisma.serviceOrder.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        }
      })
    ]);

    // Process Revenue Trend
    const formattedTrend = [];
    const getLocalDateStr = (d) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);

      const dateStr = getLocalDateStr(d);

      const dayTotal = revenueTrend.reduce((acc, curr) => {
        const currDateStr = getLocalDateStr(new Date(curr.date));
        return currDateStr === dateStr ? acc + Number(curr.amount) : acc;
      }, 0);

      formattedTrend.push({ date: dateStr, amount: dayTotal });
    }

    // Process Top Parts
    const formattedTopParts = topPartsRaw.map(p => ({
      name: p.name || 'Unknown Part',
      quantity: Number(p.total_quantity)
    }));

    // Process Status Distribution
    const statusDist = {
      PENDING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };
    orderStatusRaw.forEach(item => {
      if (statusDist[item.status] !== undefined) {
        statusDist[item.status] = item._count.status;
      }
    });

    const stats = {
      activeJobs: activeJobsCount,
      todaysSales: Number(todaysSalesAgg._sum.amount) || 0,
      lowInventory: lowInventoryCount,
      lowInventoryItems: lowInventoryItems,
      pendingApprovals: pendingApprovalsCount,
      dueToday: dueTodayOrders,
      revenueTrend: formattedTrend,
      shopCapacity: {
        current: activeJobsCount, // Reuse activeJobsCount
        total: 10
      },
      charts: {
        topParts: formattedTopParts,
        orderStatus: statusDist,
        timeRange
      },
      totalUsers,
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