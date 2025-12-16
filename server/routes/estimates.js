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
            discount,
            discountReason,
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


        // Validate Totals & Discount
        const totals = { laborTotal, partsTotal, totalAmount, discount };
        for (const [key, value] of Object.entries(totals)) {
            if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
                return res.status(400).json({
                    message: `Invalid ${key}: must be a non-negative number`,
                    error: 'INVALID_TOTAL'
                });
            }
        }

        // Validate Discount vs Total
        const calculatedSubtotal = (Number(laborTotal || 0) + Number(partsTotal || 0));
        if (discount > calculatedSubtotal) {
            return res.status(400).json({
                message: 'Discount cannot exceed the subtotal amount',
                error: 'INVALID_DISCOUNT'
            });
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

        // Generate Custom ID and Create Estimate with Retry Logic (to handle race conditions)
        let newEstimate;
        const maxRetries = 3;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Generate Custom ID with robust SQL counting
                const year = new Date().getFullYear();
                const prefix = `EST-${year}-`;

                // Get the maximum existing suffix for the current year
                // We cast the substring (digits after 'EST-YYYY-') to integer to find the true max
                // Postgres substring index is 1-based: 'EST-YYYY-' is 9 chars, so start at 10
                const result = await prisma.$queryRaw`
                    SELECT MAX(CAST(SUBSTRING(estimate_id, 10, 6) AS INTEGER)) as "maxSeq"
                    FROM "estimates"
                    WHERE "estimate_id" LIKE ${prefix + '%'}
                `;

                const maxSeq = result[0]?.maxSeq || 0;
                const nextSeq = maxSeq + 1;
                const customId = `${prefix}${String(nextSeq).padStart(6, '0')}`;

                // Create the Estimate
                newEstimate = await prisma.estimate.create({
                    data: {
                        id: customId,
                        customerId,
                        vehicleId,
                        status: status || 'PENDING',
                        expiryDate: validExpiryDate,
                        laborTotal: laborTotal || 0,
                        partsTotal: partsTotal || 0,
                        discount: discount || 0,
                        discountReason: discountReason || null,
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

                // If successful, break the loop
                break;

            } catch (error) {
                // Check for Unique Constraint Violation (P2002)
                if (error.code === 'P2002' && attempt < maxRetries - 1) {
                    console.warn(`ID collision detected (attempt ${attempt + 1}), retrying...`);
                    // Exponential backoff: 50ms, 100ms, 200ms
                    const delay = Math.pow(2, attempt) * 50;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                // If other error or max retries reached, throw
                throw error;
            }
        }

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
 * @route GET /api/estimates/stats
 * @desc Get estimate statistics
 * @access Staff, Admin
 */
router.get('/stats', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const [totalEstimates, pendingEstimates, approvedEstimates, declinedEstimates, approvedRevenue] = await Promise.all([
            prisma.estimate.count(),
            prisma.estimate.count({ where: { status: 'PENDING' } }),
            prisma.estimate.count({ where: { status: 'APPROVED' } }),
            prisma.estimate.count({ where: { status: 'DECLINED' } }),
            prisma.estimate.aggregate({
                _sum: { totalAmount: true },
                where: { status: 'APPROVED' }
            })
        ]);

        res.json({
            totalEstimates,
            pendingEstimates,
            approvedEstimates,
            declinedEstimates,
            revenue: approvedRevenue._sum.totalAmount || 0
        });
    } catch (error) {
        console.error('Get Estimate Stats Error:', error);
        res.status(500).json({ message: 'Failed to fetch estimate stats' });
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

/**
 * @route GET /api/estimates/:id
 * @desc Get a single estimate by ID
 * @access Staff, Admin
 */
router.get('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const estimate = await prisma.estimate.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        inventoryItem: true
                    }
                },
                customer: true,
                vehicle: true
            }
        });

        if (!estimate) {
            return res.status(404).json({ message: 'Estimate not found' });
        }

        res.json(estimate);
    } catch (error) {
        console.error('Get Estimate Error:', error);
        res.status(500).json({ message: 'Failed to fetch estimate' });
    }
});

/**
 * @route PUT /api/estimates/:id
 * @desc Update an estimate
 * @access Staff, Admin
 */
router.put('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            customerId,
            vehicleId,
            status,
            expiryDate,
            laborTotal,
            partsTotal,
            discount,
            discountReason,
            totalAmount,
            items
        } = req.body;

        // Check if estimate exists
        const existingEstimate = await prisma.estimate.findUnique({
            where: { id }
        });

        if (!existingEstimate) {
            return res.status(404).json({ message: 'Estimate not found' });
        }

        if (status && !VALID_ESTIMATE_STATUSES.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Allowed values: ${VALID_ESTIMATE_STATUSES.join(', ')}`,
                error: 'INVALID_STATUS'
            });
        }

        const totals = { laborTotal, partsTotal, totalAmount, discount };
        for (const [key, value] of Object.entries(totals)) {
            if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
                return res.status(400).json({
                    message: `Invalid ${key}: must be a non-negative number`,
                    error: 'INVALID_TOTAL'
                });
            }
        }

        let validItems = [];
        if (items) {
            if (!Array.isArray(items)) {
                return res.status(400).json({
                    message: 'Items must be an array',
                    error: 'INVALID_ITEMS_FORMAT'
                });
            }

            for (const [index, item] of items.entries()) {
                if (!item || typeof item !== 'object') {
                    return res.status(400).json({
                        message: `Item at index ${index} is invalid`,
                        error: 'INVALID_ITEM'
                    });
                }

                if (!item.type || !item.name) {
                    return res.status(400).json({
                        message: `Item at index ${index} missing required fields (type, name)`,
                        error: 'INVALID_ITEM_FIELDS'
                    });
                }

                const quantity = Number.parseInt(item.quantity, 10);
                const price = Number.parseFloat(item.price);
                const total = Number.parseFloat(item.total);
                const inventoryItemId = item.inventoryItemId ? Number.parseInt(item.inventoryItemId, 10) : null;

                if (!Number.isFinite(price) || price < 0) {
                    return res.status(400).json({
                        message: `Item at index ${index} has invalid price`,
                        error: 'INVALID_ITEM_PRICE'
                    });
                }

                if (!Number.isInteger(quantity) || quantity <= 0) {
                    return res.status(400).json({
                        message: `Item at index ${index} has invalid quantity`,
                        error: 'INVALID_ITEM_QUANTITY'
                    });
                }

                if (item.inventoryItemId && !Number.isInteger(inventoryItemId)) {
                    return res.status(400).json({
                        message: `Item at index ${index} has invalid inventoryItemId`,
                        error: 'INVALID_INVENTORY_ID'
                    });
                }

                validItems.push({
                    type: item.type,
                    name: item.name,
                    description: item.description || null,
                    quantity,
                    price,
                    total: Number.isFinite(total) ? total : (price * quantity),
                    inventoryItemId
                });
            }
        }

        let validExpiryDate;
        if (expiryDate) {
            const date = new Date(expiryDate);
            if (date instanceof Date && !isNaN(date.getTime())) {
                validExpiryDate = date;
            } else {
                return res.status(400).json({
                    message: 'Invalid expiry date',
                    error: 'INVALID_DATE'
                });
            }
        }

        // Transaction to update estimate and replace items
        const updatedEstimate = await prisma.$transaction(async (prisma) => {
            // 1. Delete existing items
            if (items) {
                await prisma.estimateItem.deleteMany({
                    where: { estimateId: id }
                });
            }

            // 2. Update estimate and create new items
            return prisma.estimate.update({
                where: { id },
                data: {
                    customerId: customerId || undefined,
                    vehicleId: vehicleId || undefined,
                    status: status || undefined,
                    expiryDate: validExpiryDate, // Use the validated date or undefined if not provided
                    laborTotal: laborTotal ?? undefined,
                    partsTotal: partsTotal ?? undefined,
                    discount: discount ?? undefined,
                    discountReason: discountReason ?? undefined,
                    totalAmount: totalAmount ?? undefined,
                    items: items ? {
                        create: validItems
                    } : undefined
                },
                include: {
                    items: true,
                    customer: true,
                    vehicle: true
                }
            });
        });

        res.json({
            message: 'Estimate updated successfully',
            estimate: updatedEstimate
        });

    } catch (error) {
        console.error('Update Estimate Error:', error);
        res.status(500).json({ message: 'Failed to update estimate' });
    }
});

/**
 * @route PATCH /api/estimates/:id/status
 * @desc Update estimate status only
 * @access Staff, Admin
 */
router.patch('/:id/status', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!VALID_ESTIMATE_STATUSES.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Allowed values: ${VALID_ESTIMATE_STATUSES.join(', ')}`
            });
        }

        const updatedEstimate = await prisma.estimate.update({
            where: { id },
            data: { status },
            include: {
                items: true,
                customer: { select: { firstName: true, lastName: true } },
                vehicle: { select: { make: true, model: true, licensePlate: true } }
            }
        });

        res.json({
            message: 'Status updated successfully',
            estimate: updatedEstimate
        });
    } catch (error) {
        console.error('Update Status Error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Estimate not found' });
        }
        res.status(500).json({ message: 'Failed to update status' });
    }
});

/**
 * @route DELETE /api/estimates/:id
 * @desc Delete an estimate
 * @access Staff, Admin
 */
router.delete('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check status first - maybe restrict deleting APPROVED estimates? 
        // For now, allow deleting any.

        await prisma.estimate.delete({
            where: { id }
        });

        res.json({ message: 'Estimate deleted successfully' });
    } catch (error) {
        console.error('Delete Estimate Error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Estimate not found' });
        }
        res.status(500).json({ message: 'Failed to delete estimate' });
    }
});

export default router;
