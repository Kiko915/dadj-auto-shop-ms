import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';
import imagekit from '../config/imagekit.js';
import multer from 'multer';
import fs from 'fs';

const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

const router = express.Router();

// ... (imports)

/**
 * @route GET /api/service-orders
 * @desc Get all service orders with pagination and filtering
 * @access Staff, Admin
 */
router.get('/', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, mechanic, dateFilter, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};

        // Search by ID, Customer Name, or Vehicle Details
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { customer: { firstName: { contains: search, mode: 'insensitive' } } },
                { customer: { lastName: { contains: search, mode: 'insensitive' } } },
                { vehicle: { licensePlate: { contains: search, mode: 'insensitive' } } },
                { vehicle: { make: { contains: search, mode: 'insensitive' } } },
                { vehicle: { model: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (status && status !== 'ALL') {
            if (status.includes(',')) {
                where.status = { in: status.split(',') };
            } else {
                where.status = status;
            }
        }

        // Mechanic Filter (by Name)
        if (mechanic && mechanic !== 'ALL') {
            if (mechanic === 'Unassigned') {
                where.mechanicId = null;
            } else {
                where.mechanic = { name: mechanic };
            }
        }

        // Date Filter
        if (dateFilter && dateFilter !== 'ALL') {
            const now = new Date();
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);

            if (dateFilter === 'overdue') {
                // Determine overdue based on estimatedCompletion
                // If estimatedCompletion is set and is before today
                where.estimatedCompletion = { lt: todayStart };
                where.status = { notIn: ['COMPLETED', 'CANCELLED'] };

            } else if (dateFilter === 'today') {
                // Due Today
                where.estimatedCompletion = {
                    gte: todayStart,
                    lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
                };
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
                where.createdAt = {
                    gte: weekAgo
                };
            }
        }

        // Custom Date Range (startDate, endDate)
        const { startDate, endDate } = req.query;
        if (startDate || endDate) {
            where.updatedAt = where.updatedAt || {}; // Initialize if not present

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                where.updatedAt.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.updatedAt.lte = end;
            }
        }

        const [orders, total] = await prisma.$transaction([
            prisma.serviceOrder.findMany({
                where,
                include: {
                    customer: { select: { firstName: true, lastName: true, profilePicture: true } },
                    vehicle: { select: { make: true, model: true, licensePlate: true } },
                    mechanic: { select: { name: true, profilePicture: true } },
                    _count: { select: { items: true } }
                },
                skip,
                take: parseInt(limit),
                orderBy: { [sortBy]: sortOrder }
            }),
            prisma.serviceOrder.count({ where })
        ]);

        res.json({
            items: orders,
            totalItems: total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page)
        });

    } catch (error) {
        console.error('Get Service Orders Error:', error);
        res.status(500).json({ message: 'Failed to fetch service orders' });
    }
});

/**
 * @route GET /api/service-orders/:id
 * @desc Get a single service order by ID
 * @access Staff, Admin
 */
router.get('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const order = await prisma.serviceOrder.findUnique({
            where: { id },
            include: {
                customer: true,
                vehicle: true,
                mechanic: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        profilePicture: true
                    }
                },
                items: {
                    include: {
                        inventoryItem: true
                    }
                },
                sourceEstimate: true,
                advisories: true
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Service order not found' });
        }

        res.json(order);

    } catch (error) {
        console.error('Get Service Order Error:', error);
        res.status(500).json({ message: 'Failed to fetch service order' });
    }
});

/**
 * @route POST /api/service-orders
 * @desc Create a new Service Order from an Estimate
 * @access Staff, Admin
 * @body {string} estimateId - ID of the source estimate
 * @body {string} mechanicId - ID of the assigned mechanic (optional)
 * @body {number} odometer - Current mileage (optional)
 * @body {string} estimatedCompletion - ISO Date string (optional)
 */
router.post('/', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { estimateId, mechanicId, odometer, estimatedCompletion, customerId, vehicleId, items, partsTotal, laborTotal, totalAmount } = req.body;

        let sourceData = {};

        if (estimateId) {
            // 1. Fetch Estimate
            const estimate = await prisma.estimate.findUnique({
                where: { id: estimateId },
                include: { items: true, vehicle: true }
            });

            if (!estimate) {
                return res.status(404).json({ message: 'Estimate not found' });
            }

            sourceData = {
                customerId: estimate.customerId,
                vehicleId: estimate.vehicleId,
                items: estimate.items, // EstimateItems
                partsTotal: estimate.partsTotal,
                laborTotal: estimate.laborTotal,
                totalAmount: estimate.totalAmount,
                currentMileage: estimate.vehicle.mileage || 0,
                sourceEstimateId: estimate.id
            };
        } else {
            // Direct Creation Validation
            if (!customerId || !vehicleId || !items || items.length === 0) {
                return res.status(400).json({ message: 'For direct orders: Customer, Vehicle, and Items are required.' });
            }

            // Fetch vehicle for mileage check
            const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

            sourceData = {
                customerId,
                vehicleId,
                items, // Raw items from body
                partsTotal: partsTotal || 0,
                laborTotal: laborTotal || 0,
                totalAmount: totalAmount || 0,
                currentMileage: vehicle.mileage || 0,
                sourceEstimateId: null
            };
        }

        // 2. Validate Mechanic if provided
        if (mechanicId) {
            const mechanic = await prisma.user.findUnique({ where: { id: mechanicId } });
            if (!mechanic || mechanic.role !== 'mechanic') {
                return res.status(400).json({ message: 'Invalid mechanic ID' });
            }
        }

        let serviceOrder;
        let retries = 3;

        while (retries > 0) {
            try {
                // 3. Generate Custom Service Order ID: SO-YYYY-XXXXXX
                const year = new Date().getFullYear();
                const prefix = `SO-${year}-`;

                // Find max sequence for current year
                const result = await prisma.$queryRaw`
                    SELECT MAX(CAST(SUBSTRING(order_id, 9, 6) AS INTEGER)) as "maxSeq"
                    FROM "service_orders"
                    WHERE "order_id" LIKE ${prefix + '%'}
                `;

                const maxSeq = result[0]?.maxSeq || 0;
                const nextSeq = maxSeq + 1;
                const customId = `${prefix}${String(nextSeq).padStart(6, '0')}`;

                // 4. Prepare Order Items
                const orderItems = sourceData.items.map(item => ({
                    type: item.type,
                    name: item.name,
                    description: item.description,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total || (item.price * item.quantity),
                    inventoryItemId: item.inventoryItemId
                }));

                // 5. Transaction
                serviceOrder = await prisma.$transaction(async (prisma) => {
                    // Update Vehicle Mileage
                    if (odometer && odometer > sourceData.currentMileage) {
                        await prisma.vehicle.update({
                            where: { id: sourceData.vehicleId },
                            data: { mileage: odometer }
                        });
                    }

                    // Inventory Logic
                    let orderNotes = null;
                    let hasInsufficientStock = false;

                    for (const item of sourceData.items) {
                        if (item.inventoryItemId) {
                            const inventoryItem = await prisma.inventoryItem.findUnique({
                                where: { id: item.inventoryItemId }
                            });

                            if (inventoryItem) {
                                if (inventoryItem.quantity < item.quantity) {
                                    hasInsufficientStock = true;
                                }

                                await prisma.inventoryItem.update({
                                    where: { id: item.inventoryItemId },
                                    data: { quantity: { decrement: item.quantity } }
                                });
                            }
                        }
                    }

                    if (hasInsufficientStock) {
                        orderNotes = "Waiting for parts";
                    }

                    // Create Service Order
                    const newOrder = await prisma.serviceOrder.create({
                        data: {
                            id: customId,
                            customerId: sourceData.customerId,
                            vehicleId: sourceData.vehicleId,
                            sourceEstimateId: sourceData.sourceEstimateId,
                            mechanicId: mechanicId || null,
                            odometer: odometer || null,
                            estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : null,
                            status: 'PENDING',
                            notes: orderNotes,
                            laborTotal: sourceData.laborTotal,
                            partsTotal: sourceData.partsTotal,
                            totalAmount: sourceData.totalAmount,
                            items: {
                                create: orderItems
                            }
                        }
                    });

                    // Update Estimate Status if applicable
                    if (sourceData.sourceEstimateId) {
                        await prisma.estimate.update({
                            where: { id: sourceData.sourceEstimateId },
                            data: { status: 'APPROVED' }
                        });
                    }

                    return newOrder;
                });
                break; // Success
            } catch (error) {
                if (error.code === 'P2002') {
                    retries--;
                    if (retries === 0) throw error;
                    continue;
                }
                throw error;
            }
        }


        res.status(201).json({
            message: 'Service Order created successfully',
            serviceOrder
        });

    } catch (error) {
        console.error('Create Service Order Error:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Service Order already exists for this estimate' });
        }
        res.status(500).json({ message: 'Failed to create service order', error: error.message });
    }
});

/**
 * @route PUT /api/service-orders/:id
 * @desc Update a service order (Status, Notes, etc.)
 * @access Staff, Admin
 */
router.put('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, mechanicId, estimatedCompletion } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (mechanicId !== undefined) updateData.mechanicId = mechanicId; // Allow setting to null
        if (estimatedCompletion !== undefined) updateData.estimatedCompletion = estimatedCompletion;

        const updatedOrder = await prisma.serviceOrder.update({
            where: { id },
            data: updateData,
            include: {
                customer: { select: { firstName: true, lastName: true, profilePicture: true } },
                vehicle: { select: { make: true, model: true, licensePlate: true } },
                mechanic: { select: { name: true, profilePicture: true } }
            }
        });

        res.json(updatedOrder);

    } catch (error) {
        console.error('Update Service Order Error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Service order not found' });
        }
        res.status(500).json({ message: 'Failed to update service order' });
    }
});


/**
 * @route POST /api/service-orders/:id/items
 * @desc Add an item (Part or Labor) to a Service Order
 * @access Staff, Admin
 */
router.post('/:id/items', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { type, name, description, quantity, price, inventoryItemId } = req.body;

        const serviceOrder = await prisma.$transaction(async (prisma) => {
            // 1. If it's a part, check and deduct inventory
            if (type === 'PART' && inventoryItemId) {
                const inventoryItem = await prisma.inventoryItem.findUnique({
                    where: { id: inventoryItemId }
                });

                if (!inventoryItem) throw new Error('Inventory item not found');

                // Strict Stock Check
                if (inventoryItem.quantity < quantity) {
                    throw new Error(`Insufficient stock. Only ${inventoryItem.quantity} available.`);
                }

                await prisma.inventoryItem.update({
                    where: { id: inventoryItemId },
                    data: { quantity: { decrement: quantity } }
                });
            }

            // 2. Create Service Order Item
            await prisma.serviceOrderItem.create({
                data: {
                    orderId: id,
                    type,
                    name,
                    description,
                    quantity,
                    price,
                    total: price * quantity,
                    inventoryItemId: inventoryItemId || null
                }
            });

            // 3. Recalculate Order Totals
            const allItems = await prisma.serviceOrderItem.findMany({ where: { orderId: id } });

            const laborTotal = allItems
                .filter(i => i.type === 'LABOR')
                .reduce((sum, i) => sum + Number(i.total), 0);

            const partsTotal = allItems
                .filter(i => i.type === 'PART')
                .reduce((sum, i) => sum + Number(i.total), 0);

            const updatedOrder = await prisma.serviceOrder.update({
                where: { id },
                data: {
                    laborTotal,
                    partsTotal,
                    totalAmount: laborTotal + partsTotal
                },
                include: { items: true } // Return items to update UI
            });

            return updatedOrder;
        });

        res.status(201).json(serviceOrder);

    } catch (error) {
        console.error('Add Item Error:', error);
        res.status(500).json({ message: 'Failed to add item', error: error.message });
    }
});

/**
 * @route PUT /api/service-orders/:id/items/:itemId
 * @desc Update an item in a Service Order
 * @access Staff, Admin
 */
router.put('/:id/items/:itemId', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const { name, description, quantity, price } = req.body;

        const updatedOrder = await prisma.$transaction(async (prisma) => {
            // 1. Get existing item to check for quantity changes
            const existingItem = await prisma.serviceOrderItem.findUnique({
                where: { id: itemId }
            });

            if (!existingItem) throw new Error('Item not found');

            // 2. Handle Inventory Adjustment if Quantity Changed (Parts only)
            if (existingItem.type === 'PART' && existingItem.inventoryItemId && quantity !== undefined && quantity !== existingItem.quantity) {
                const diff = quantity - existingItem.quantity;

                // If increasing quantity (diff > 0), check if we have enough stock
                if (diff > 0) {
                    const inventoryItem = await prisma.inventoryItem.findUnique({
                        where: { id: existingItem.inventoryItemId }
                    });

                    if (inventoryItem && inventoryItem.quantity < diff) {
                        throw new Error(`Insufficient stock. Only ${inventoryItem.quantity} more available.`);
                    }
                }

                // If diff is positive (added more), decrement stock. 
                // If diff is negative (reduced qty), increment stock (decrement by negative).
                await prisma.inventoryItem.update({
                    where: { id: existingItem.inventoryItemId },
                    data: { quantity: { decrement: diff } }
                });
            }

            // 3. Update Item
            const updateData = {};
            if (name) updateData.name = name;
            if (description !== undefined) updateData.description = description;

            // Recalculate total if price or quantity changes
            let newPrice = existingItem.price;
            let newQuantity = existingItem.quantity;

            if (price !== undefined) {
                updateData.price = price;
                newPrice = price;
            }
            if (quantity !== undefined) {
                updateData.quantity = quantity;
                newQuantity = quantity;
            }

            updateData.total = Number(newPrice) * Number(newQuantity);

            await prisma.serviceOrderItem.update({
                where: { id: itemId },
                data: updateData
            });

            // 4. Recalculate Order Totals
            const allItems = await prisma.serviceOrderItem.findMany({ where: { orderId: id } });

            const laborTotal = allItems
                .filter(i => i.type === 'LABOR')
                .reduce((sum, i) => sum + Number(i.total), 0);

            const partsTotal = allItems
                .filter(i => i.type === 'PART')
                .reduce((sum, i) => sum + Number(i.total), 0);

            return await prisma.serviceOrder.update({
                where: { id },
                data: {
                    laborTotal,
                    partsTotal,
                    totalAmount: laborTotal + partsTotal
                },
                include: { items: true }
            });
        });

        res.json(updatedOrder);

    } catch (error) {
        console.error('Update Item Error:', error);
        res.status(500).json({ message: 'Failed to update item', error: error.message });
    }
});

/**
 * @route DELETE /api/service-orders/:id/items/:itemId
 * @desc Remove an item from a Service Order
 * @access Staff, Admin
 */
router.delete('/:id/items/:itemId', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id, itemId } = req.params;

        const updatedOrder = await prisma.$transaction(async (prisma) => {
            // 1. Get item to restore inventory
            const existingItem = await prisma.serviceOrderItem.findUnique({
                where: { id: itemId }
            });

            if (!existingItem) throw new Error('Item not found');

            // 2. Restore Inventory (Parts only)
            if (existingItem.type === 'PART' && existingItem.inventoryItemId) {
                await prisma.inventoryItem.update({
                    where: { id: existingItem.inventoryItemId },
                    data: { quantity: { increment: existingItem.quantity } }
                });
            }

            // 3. Delete Item
            await prisma.serviceOrderItem.delete({
                where: { id: itemId }
            });

            // 4. Recalculate Order Totals
            const allItems = await prisma.serviceOrderItem.findMany({ where: { orderId: id } });

            const laborTotal = allItems
                .filter(i => i.type === 'LABOR')
                .reduce((sum, i) => sum + Number(i.total), 0);

            const partsTotal = allItems
                .filter(i => i.type === 'PART')
                .reduce((sum, i) => sum + Number(i.total), 0);

            return await prisma.serviceOrder.update({
                where: { id },
                data: {
                    laborTotal,
                    partsTotal,
                    totalAmount: laborTotal + partsTotal
                },
                include: { items: true }
            });
        });

        res.json(updatedOrder);

    } catch (error) {
        console.error('Delete Item Error:', error);
        res.status(500).json({ message: 'Failed to delete item', error: error.message });
    }
});

// ... (Advisory Routes to be added)

/**
 * @route POST /api/service-orders/:id/advisories
 * @desc Add an advisory to a service order
 * @access Staff, Admin
 */
router.post('/:id/advisories', authenticateToken, authorizeRoles(['staff', 'admin']), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ message: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, severity } = req.body;
        const file = req.file;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        // 1. Create Advisory Record First (without image)
        const advisory = await prisma.serviceOrderAdvisory.create({
            data: {
                orderId: id,
                content,
                severity: severity || 'LOW',
                imageUrl: null,
                imageFileId: null
            }
        });

        // 2. Upload Image if present
        if (file) {
            try {
                const fileBuffer = fs.readFileSync(file.path);
                const uploadResponse = await imagekit.upload({
                    file: fileBuffer,
                    fileName: `advisory_${id}_${Date.now()}_${file.originalname}`,
                    folder: '/advisories'
                });

                // 3. Update Advisory with Image Details
                await prisma.serviceOrderAdvisory.update({
                    where: { id: advisory.id },
                    data: {
                        imageUrl: uploadResponse.url,
                        imageFileId: uploadResponse.fileId
                    }
                });

                // Update returned object
                advisory.imageUrl = uploadResponse.url;
                advisory.imageFileId = uploadResponse.fileId;

            } catch (uploadError) {
                console.error('ImageKit Upload Error:', uploadError);
                // We don't fail the request, just log error. Advisory is created without image.
                // Could optionally add a 'note' or flash message that image failed.
            } finally {
                // 4. Cleanup local file
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }

        res.status(201).json(advisory);

    } catch (error) {
        console.error('Add Advisory Error:', error);
        res.status(500).json({ message: 'Failed to add advisory' });
    }
});


/**
 * @route PUT /api/service-orders/:id/advisories/:advisoryId
 * @desc Update an advisory
 * @access Staff, Admin
 */
router.put('/:id/advisories/:advisoryId', authenticateToken, authorizeRoles(['staff', 'admin']), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ message: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { id, advisoryId } = req.params;
        const { content, severity } = req.body;
        const file = req.file;

        const advisory = await prisma.serviceOrderAdvisory.findUnique({
            where: { id: advisoryId }
        });

        if (!advisory) {
            return res.status(404).json({ message: 'Advisory not found' });
        }

        if (advisory.orderId !== id) {
            return res.status(400).json({ message: 'Advisory does not belong to this order' });
        }

        let imageUrl = advisory.imageUrl;
        let imageFileId = advisory.imageFileId;

        // If a new file is uploaded, replace the old one
        if (file) {
            try {
                // Delete old image if it exists
                if (advisory.imageFileId) {
                    await imagekit.deleteFile(advisory.imageFileId).catch(err => {
                        console.warn('Failed to delete old image from ImageKit:', err);
                    });
                }

                // Upload new image
                const fileBuffer = fs.readFileSync(file.path);
                const uploadResponse = await imagekit.upload({
                    file: fileBuffer,
                    fileName: `advisory_${id}_${Date.now()}_${file.originalname}`,
                    folder: '/advisories'
                });

                imageUrl = uploadResponse.url;
                imageFileId = uploadResponse.fileId;

                // Cleanup local file
                fs.unlinkSync(file.path);
            } catch (uploadError) {
                console.error('ImageKit Upload Error:', uploadError);
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                return res.status(500).json({ message: 'Failed to upload new image' });
            }
        }

        const updatedAdvisory = await prisma.serviceOrderAdvisory.update({
            where: { id: advisoryId },
            data: {
                content: content || advisory.content,
                severity: severity || advisory.severity,
                imageUrl,
                imageFileId
            }
        });

        res.json(updatedAdvisory);

    } catch (error) {
        console.error('Update Advisory Error:', error);
        res.status(500).json({ message: 'Failed to update advisory' });
    }
});

/**
 * @route DELETE /api/service-orders/:id/advisories/:advisoryId
 * @desc Delete an advisory
 * @access Staff, Admin
 */
router.delete('/:id/advisories/:advisoryId', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id, advisoryId } = req.params;

        const advisory = await prisma.serviceOrderAdvisory.findUnique({
            where: { id: advisoryId }
        });

        if (!advisory) {
            return res.status(404).json({ message: 'Advisory not found' });
        }

        if (advisory.orderId !== id) {
            return res.status(400).json({ message: 'Advisory does not belong to this order' });
        }

        // Delete image from ImageKit
        if (advisory.imageFileId) {
            try {
                await imagekit.deleteFile(advisory.imageFileId);
            } catch (err) {
                console.error('Failed to delete image from ImageKit:', err);
            }
        }

        await prisma.serviceOrderAdvisory.delete({
            where: { id: advisoryId }
        });

        res.json({ message: 'Advisory deleted successfully' });

    } catch (error) {
        console.error('Delete Advisory Error:', error);
        res.status(500).json({ message: 'Failed to delete advisory' });
    }
});

/**
 * @route DELETE /api/service-orders/:id
 * @desc Delete (Archive) a service order
 * @access Staff, Admin
 */
router.delete('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const order = await prisma.serviceOrder.findUnique({
            where: { id },
            include: { advisories: true }
        });

        if (!order) {
            return res.status(404).json({ message: 'Service Order not found' });
        }

        // Transaction to delete everything
        await prisma.$transaction(async (prisma) => {
            // 1. Delete all items
            await prisma.serviceOrderItem.deleteMany({
                where: { orderId: id }
            });

            // 2. Delete all advisories (and cleanup images)
            for (const advisory of order.advisories) {
                if (advisory.imageFileId) {
                    await imagekit.deleteFile(advisory.imageFileId).catch(err => {
                        console.warn('Failed to delete advisory image:', err);
                    });
                }
            }
            await prisma.serviceOrderAdvisory.deleteMany({
                where: { orderId: id }
            });

            // 3. Delete the order itself
            await prisma.serviceOrder.delete({
                where: { id }
            });

            // Optional: Revert estimate status? 
            // If we archive/delete a cancelled order, usually we just want it gone.
            // If sourceEstimateId exists, maybe we update it?
            // Leaving estimate touched for now as the prompt didn't specify.
        });

        res.json({ message: 'Service Order archived/deleted successfully' });

    } catch (error) {
        console.error('Delete Service Order Error:', error);
        res.status(500).json({ message: 'Failed to delete service order', error: error.message });
    }
});


/**
 * @route GET /api/service-orders/:id/notes
 * @desc Get all notes for a service order
 * @access Staff, Admin
 */
router.get('/:id/notes', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const notes = await prisma.serviceOrderNote.findMany({
            where: { orderId: id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notes);
    } catch (error) {
        console.error('Get Notes Error:', error);
        res.status(500).json({ message: 'Failed to fetch notes' });
    }
});

/**
 * @route POST /api/service-orders/:id/notes
 * @desc Add a note to a service order
 * @access Staff, Admin
 */
router.post('/:id/notes', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const note = await prisma.serviceOrderNote.create({
            data: {
                orderId: id,
                content
            }
        });

        res.status(201).json(note);
    } catch (error) {
        console.error('Add Note Error:', error);
        res.status(500).json({ message: 'Failed to add note' });
    }
});

/**
 * @route PUT /api/service-orders/:id/notes/:noteId
 * @desc Update a service order note
 * @access Staff, Admin
 */
router.put('/:id/notes/:noteId', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id, noteId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const note = await prisma.serviceOrderNote.findUnique({
            where: { id: noteId }
        });

        if (!note || note.orderId !== id) {
            return res.status(404).json({ message: 'Note not found or does not belong to this order' });
        }

        const updatedNote = await prisma.serviceOrderNote.update({
            where: { id: noteId },
            data: { content }
        });

        res.json(updatedNote);
    } catch (error) {
        console.error('Update Note Error:', error);
        res.status(500).json({ message: 'Failed to update note' });
    }
});

/**
 * @route DELETE /api/service-orders/:id/notes/:noteId
 * @desc Delete a service order note
 * @access Staff, Admin
 */
router.delete('/:id/notes/:noteId', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id, noteId } = req.params;

        const note = await prisma.serviceOrderNote.findUnique({
            where: { id: noteId }
        });

        if (!note || note.orderId !== id) {
            return res.status(404).json({ message: 'Note not found or does not belong to this order' });
        }

        await prisma.serviceOrderNote.delete({
            where: { id: noteId }
        });

        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Delete Note Error:', error);
        res.status(500).json({ message: 'Failed to delete note' });
    }
});

export default router;
