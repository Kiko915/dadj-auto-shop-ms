import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';

const router = express.Router();

const VALID_ESTIMATE_STATUSES = Object.freeze(['DRAFT', 'PENDING', 'APPROVED', 'DECLINED', 'EXPIRED']);

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
        if (status && !VALID_ESTIMATE_STATUSES.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Allowed values: ${VALID_ESTIMATE_STATUSES.join(', ')}`,
                error: 'INVALID_STATUS'
            });
        }

        if (!customerId || !vehicleId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Missing required fields: customerId, vehicleId, and items are required',
                error: 'MISSING_FIELDS'
            });
        }

        // Validate Existence
        const [customerExists, vehicleExists] = await Promise.all([
            prisma.customer.findUnique({ where: { id: customerId } }),
            prisma.vehicle.findUnique({ where: { id: vehicleId } })
        ]);

        if (!customerExists) {
            return res.status(400).json({
                message: 'Customer not found',
                error: 'CUSTOMER_NOT_FOUND'
            });
        }

        if (!vehicleExists) {
            return res.status(400).json({
                message: 'Vehicle not found',
                error: 'VEHICLE_NOT_FOUND'
            });
        }

        // Validate Totals
        const totals = { laborTotal, partsTotal, totalAmount };
        for (const [key, value] of Object.entries(totals)) {
            if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
                return res.status(400).json({
                    message: `Invalid ${key}: must be a non-negative number`,
                    error: 'INVALID_TOTAL'
                });
            }
        }

        // Validate expiryDate
        let validExpiryDate = null;
        if (expiryDate) {
            const parsedDate = new Date(expiryDate);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    message: 'Invalid expiryDate format provided',
                    error: 'INVALID_DATE'
                });
            }
            validExpiryDate = parsedDate;
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
                expiryDate: validExpiryDate,
                laborTotal: laborTotal || 0,
                partsTotal: partsTotal || 0,
                totalAmount: totalAmount || 0,
                items: {
                    create: validItems
                }
            },
            include: {
                items: true,
                customer: {
                    select: { firstName: true, lastName: true }
                },
                vehicle: {
                    select: { make: true, model: true, licensePlate: true }
                }
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
        const { status, search, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};

        if (status) {
            if (!VALID_ESTIMATE_STATUSES.includes(status)) {
                return res.status(400).json({
                    message: `Invalid status filter. Allowed values: ${VALID_ESTIMATE_STATUSES.join(', ')}`,
                    error: 'INVALID_STATUS_FILTER'
                });
            }
            where.status = status;
        }

        if (search) {
            where.OR = [
                { customer: { firstName: { contains: search, mode: 'insensitive' } } },
                { customer: { lastName: { contains: search, mode: 'insensitive' } } },
                { vehicle: { licensePlate: { contains: search, mode: 'insensitive' } } }
            ];

            // Check if search looks like a numeric ID or UUID/CUID and add exact match
            // Note: Schema defines ID as String, so we pass raw string even for numeric-looking inputs
            const isNumeric = /^[0-9]+$/.test(search);
            const isUuid = /^[0-9a-fA-F-]{36}$/.test(search);

            if (isNumeric || isUuid) {
                where.OR.push({ id: search });
            }
        }

        const [estimates, total] = await prisma.$transaction([
            prisma.estimate.findMany({
                where,
                skip,
                take,
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
            }),
            prisma.estimate.count({ where })
        ]);

        res.json({
            items: estimates,
            totalPages: Math.ceil(total / take),
            currentPage: parseInt(page),
            totalItems: total
        });
    } catch (error) {
        console.error('Get Estimates Error:', error);
        res.status(500).json({ message: 'Failed to fetch estimates' });
    }
});

export default router;
