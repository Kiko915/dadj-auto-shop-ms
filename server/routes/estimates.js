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

        // Extended Validation
        const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'DECLINED', 'EXPIRED'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
                error: 'INVALID_STATUS'
            });
        }

        if (!customerId || !vehicleId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Missing required fields: customerId, vehicleId, and items are required',
                error: 'MISSING_FIELDS'
            });
        }

        // Validate Totals
        const totals = { laborTotal, partsTotal, totalAmount };
        for (const [key, value] of Object.entries(totals)) {
            if (value !== undefined && (typeof value !== 'number' || value < 0)) {
                return res.status(400).json({
                    message: `Invalid ${key}: must be a non-negative number`,
                    error: 'INVALID_TOTAL'
                });
            }
        }

        // Validate and Parse Items
        const validItems = [];
        for (const [index, item] of items.entries()) {
            if (!item || typeof item !== 'object') {
                return res.status(400).json({
                    message: `Invalid item at index ${index}`,
                    error: 'INVALID_ITEM'
                });
            }

            const { type, name, description } = item;

            // Parse numbers explicitly to avoid NaN
            const quantity = Number.parseInt(item.quantity, 10);
            const price = Number.parseFloat(item.price);
            const total = Number.parseFloat(item.total);
            const inventoryItemId = item.inventoryItemId ? Number.parseInt(item.inventoryItemId, 10) : null;

            if (!type || !name) {
                return res.status(400).json({
                    message: `Item at index ${index} missing required fields (type, name)`,
                    error: 'INVALID_ITEM_FIELDS'
                });
            }

            // Validate parsed numbers
            if (!Number.isFinite(price) || price < 0) {
                return res.status(400).json({
                    message: `Item at index ${index} has invalid price: must be non-negative number`,
                    error: 'INVALID_ITEM_PRICE'
                });
            }

            // Quantity must be absolute integer >= 1
            if (!Number.isInteger(quantity) || quantity <= 0) {
                return res.status(400).json({
                    message: `Item at index ${index} has invalid quantity: must be a positive integer`,
                    error: 'INVALID_ITEM_QUANTITY'
                });
            }

            if (inventoryItemId !== null && !Number.isInteger(inventoryItemId)) {
                return res.status(400).json({
                    message: `Item at index ${index} has invalid inventoryItemId`,
                    error: 'INVALID_INVENTORY_ID'
                });
            }

            validItems.push({
                type,
                name,
                description: description || null,
                quantity,
                price,
                total: Number.isFinite(total) ? total : (price * quantity),
                inventoryItemId
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
                    create: validItems
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
            const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'DECLINED', 'EXPIRED'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: `Invalid status filter. Allowed values: ${validStatuses.join(', ')}`,
                    error: 'INVALID_STATUS_FILTER'
                });
            }
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
