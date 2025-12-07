import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';

const router = express.Router();

/**
 * @route POST /api/estimates
 * @desc Create a new Estimate
 * @access Staff, Admin
 * @body {string} customerId - ID of the customer
 * @body {string} vehicleId - ID of the vehicle
 * @body {string} status - PENDING | APPROVED | DECLINED | EXPIRED
 * @body {string} [expiryDate] - Optional expiry date
 * @body {number} laborTotal - Calculated labor total
 * @body {number} partsTotal - Calculated parts total
 * @body {number} totalAmount - Grand total
 * @body {Array} items - List of items { type, name, description, quantity, price, total, inventoryItemId }
 */
router.post('/', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const {
            customerId,
            vehicleId,
            status,
            expiryDate,
            laborTotal,
            partsTotal,
            totalAmount,
            items
        } = req.body;

        // Basic Validation
        if (!customerId || !vehicleId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Missing required fields: customerId, vehicleId, and items are required',
                error: 'MISSING_FIELDS'
            });
        }

        // Create the Estimate and Items in a transaction (nested write)
        const newEstimate = await prisma.estimate.create({
            data: {
                customerId,
                vehicleId,
                status: status || 'PENDING',
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                laborTotal: laborTotal || 0,
                partsTotal: partsTotal || 0,
                totalAmount: totalAmount || 0,
                items: {
                    create: items.map(item => ({
                        type: item.type, // PART or LABOR
                        name: item.name,
                        description: item.description || null,
                        quantity: parseInt(item.quantity) || 1,
                        price: parseFloat(item.price) || 0,
                        total: parseFloat(item.total) || 0,
                        inventoryItemId: item.inventoryItemId ? parseInt(item.inventoryItemId) : null
                    }))
                }
            },
            include: {
                items: true,
                customer: true,
                vehicle: true
            }
        });

        res.status(201).json({
            message: 'Estimate created successfully',
            estimate: newEstimate
        });

    } catch (error) {
        console.error('Create Estimate Error:', error);
        res.status(500).json({
            message: 'Failed to create estimate',
            error: 'ESTIMATE_ERROR'
        });
    }
});

/**
 * @route GET /api/estimates
 * @desc Get all estimates
 * @access Staff, Admin
 */
router.get('/', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { status, search } = req.query;
        const where = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { customer: { firstName: { contains: search, mode: 'insensitive' } } },
                { customer: { lastName: { contains: search, mode: 'insensitive' } } },
                { vehicle: { licensePlate: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const estimates = await prisma.estimate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: {
                    select: { firstName: true, lastName: true }
                },
                vehicle: {
                    select: { make: true, model: true, licensePlate: true }
                },
                _count: {
                    select: { items: true }
                }
            }
        });

        res.json(estimates);
    } catch (error) {
        console.error('Get Estimates Error:', error);
        res.status(500).json({ message: 'Failed to fetch estimates' });
    }
});

export default router;
