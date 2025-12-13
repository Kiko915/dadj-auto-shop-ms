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
            where.status = status;
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
            const todayStart = new Date(now.setHours(0, 0, 0, 0));

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
        const { estimateId, mechanicId, odometer, estimatedCompletion } = req.body;

        if (!estimateId) {
            return res.status(400).json({ message: 'Estimate ID is required' });
        }

        // 1. Fetch Estimate with necessary relations
        const estimate = await prisma.estimate.findUnique({
            where: { id: estimateId },
            include: {
                items: true,
                vehicle: true
            }
        });

        if (!estimate) {
            return res.status(404).json({ message: 'Estimate not found' });
        }

        // 2. Validate Mechanic if provided
        if (mechanicId) {
            const mechanic = await prisma.user.findUnique({
                where: { id: mechanicId }
            });
            if (!mechanic || mechanic.role !== 'mechanic') {
                return res.status(400).json({ message: 'Invalid mechanic ID' });
            }
        }

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

        // 4. Transform Estimate Items to Service Order Items
        // Note: EstimateItem and ServiceOrderItem have slightly different structures (ServiceOrderItem references InventoryItem via Int ID)
        // We match them mapping fields.
        const orderItems = estimate.items.map(item => ({
            type: item.type,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            inventoryItemId: item.inventoryItemId // This is Int, same as model
        }));

        // 5. Transaction: Create Order, Update/Verify Mileage, Update Inventory, Update Estimate Status
        const serviceOrder = await prisma.$transaction(async (prisma) => {
            // Update Vehicle Mileage if provided and greater than current
            if (odometer && odometer > (estimate.vehicle.mileage || 0)) {
                await prisma.vehicle.update({
                    where: { id: estimate.vehicleId },
                    data: { mileage: odometer }
                });
            }

            // Inventory Check & Deduction Logic
            let orderNotes = null;
            let hasInsufficientStock = false;

            for (const item of estimate.items) {
                // Only check inventory for PARTS (where inventoryItemId exists)
                if (item.inventoryItemId) {
                    const inventoryItem = await prisma.inventoryItem.findUnique({
                        where: { id: item.inventoryItemId }
                    });

                    if (inventoryItem) {
                        // Check availability
                        if (inventoryItem.quantity < item.quantity) {
                            hasInsufficientStock = true;
                        }

                        // Deduct stock (allow negative for now, or stop at 0? 
                        // Standard practice if we create the order is to deduct it to show the deficit)
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
                    customerId: estimate.customerId,
                    vehicleId: estimate.vehicleId,
                    sourceEstimateId: estimate.id,
                    mechanicId: mechanicId || null,
                    odometer: odometer || null,
                    estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : null,
                    status: 'PENDING', // Default is PENDING, but adding note if stock issue
                    notes: orderNotes,
                    laborTotal: estimate.laborTotal,
                    partsTotal: estimate.partsTotal,
                    totalAmount: estimate.totalAmount,
                    items: {
                        create: orderItems
                    }
                }
            });

            // Update Estimate Status to APPROVED (if not already)
            await prisma.estimate.update({
                where: { id: estimate.id },
                data: { status: 'APPROVED' }
            });

            return newOrder;
        });

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

        let imageUrl = null;
        let imageFileId = null;

        if (file) {
            try {
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
                // Try cleanup
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                return res.status(500).json({ message: 'Failed to upload image' });
            }
        }

        const advisory = await prisma.serviceOrderAdvisory.create({
            data: {
                orderId: id,
                content,
                severity: severity || 'LOW',
                imageUrl,
                imageFileId
            }
        });

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

export default router;

