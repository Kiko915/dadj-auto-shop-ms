import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';

import imagekit from '../config/imagekit.js';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept CSV files
        if (
            file.mimetype === 'text/csv' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'text/plain' ||
            file.originalname.endsWith('.csv')
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

const router = express.Router();

/**
 * @route GET /api/inventory
 * @desc Get all inventory items with pagination, search, and filtering
 * @access Staff, Admin
 */
router.get('/', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        console.log('Backend: GET /inventory query:', req.query);
        const { page = 1, limit = 10, search, category, brand, sortBy = 'updatedAt', sortOrder = 'desc', stockStatus } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (category && category !== 'All') {
            where.category = category;
        }

        if (brand && brand !== 'All') {
            where.brand = { contains: brand, mode: 'insensitive' };
        }

        if (stockStatus) {
            if (stockStatus === 'low') {
                // For low stock, we need to compare quantity with lowStockThreshold
                // Since Prisma doesn't support comparing two columns directly in where clause easily without raw query,
                // we might need to handle this carefully. 
                // However, for simplicity in this setup, we can use a fixed threshold or raw query if needed.
                // But let's try to use the threshold column if possible, or fallback to a fixed value if complex.
                // Prisma doesn't support `quantity: { lte: prisma.inventoryItem.fields.lowStockThreshold }` directly yet.
                // So we will filter for quantity <= 5 as a fallback or use raw query if critical.
                // Let's stick to a simple fixed check for now or handle in application logic if dataset is small, 
                // but for pagination we need DB level.
                // Let's use a raw query for this specific case or just a fixed number for now to keep it simple.
                where.quantity = { lte: 5 };
            } else if (stockStatus === 'out') {
                where.quantity = 0;
            }
        }

        // Validate sort fields to prevent injection
        const allowedSortFields = ['name', 'buyingPrice', 'sellingPrice', 'quantity', 'updatedAt'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'updatedAt';
        const order = sortOrder === 'asc' ? 'asc' : 'desc';

        const [items, total] = await prisma.$transaction([
            prisma.inventoryItem.findMany({
                where,
                skip,
                take,
                orderBy: { [sortField]: order },
            }),
            prisma.inventoryItem.count({ where }),
        ]);

        res.json({
            items,
            totalPages: Math.ceil(total / take),
            currentPage: parseInt(page),
            totalItems: total,
        });
    } catch (error) {
        console.error('Get Inventory Error:', error);
        res.status(500).json({ message: 'Failed to fetch inventory' });
    }
});

/**
 * @route GET /api/inventory/stats
 * @desc Get inventory summary statistics
 * @access Staff, Admin
 */
router.get('/stats', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const totalProducts = await prisma.inventoryItem.count();

        const lowStockItems = await prisma.inventoryItem.count({
            where: {
                quantity: {
                    lte: 5 // Default threshold, ideally compare with lowStockThreshold column if possible per item
                }
            }
        });

        // Calculate total value
        const allItems = await prisma.inventoryItem.findMany({
            select: {
                quantity: true,
                buyingPrice: true
            }
        });

        const totalValue = allItems.reduce((sum, item) => {
            return sum + (Number(item.buyingPrice) * item.quantity);
        }, 0);

        res.json({
            totalProducts,
            lowStockItems,
            totalValue
        });
    } catch (error) {
        console.error('Get Inventory Stats Error:', error);
        res.status(500).json({ message: 'Failed to fetch inventory stats' });
    }
});

/**
 * @route GET /api/inventory/categories
 * @desc Get all unique categories
 * @access Staff, Admin
 */
router.get('/categories', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const categories = await prisma.inventoryItem.findMany({
            select: {
                category: true
            },
            distinct: ['category']
        });

        // Extract category names and sort them
        const uniqueCategories = categories
            .map(item => item.category)
            .sort();

        res.json(uniqueCategories);
    } catch (error) {
        console.error('Get Categories Error:', error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
});

/**
 * @route GET /api/inventory/brands
 * @desc Get all unique brands
 * @access Staff, Admin
 */
router.get('/brands', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const brands = await prisma.inventoryItem.findMany({
            select: {
                brand: true
            },
            distinct: ['brand']
        });

        // Extract brand names and sort them
        const uniqueBrands = brands
            .map(item => item.brand)
            .sort();

        res.json(uniqueBrands);
    } catch (error) {
        console.error('Get Brands Error:', error);
        res.status(500).json({ message: 'Failed to fetch brands' });
    }
});

/**
     * @route GET /api/inventory/:id
     * @desc Get a single inventory item by ID
     * @access Staff, Admin
     */
/**
 * @route GET /api/inventory/reports
 * @desc Get detailed inventory reports and analytics
 * @access Staff, Admin
 */
const RESTOCK_THRESHOLD_MULTIPLIER = 3;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

router.get('/reports', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // 1. Fetch Core Data
        const allItems = await fetchAllInventoryItems();

        // 2. Compute/Fetch Specifics
        const fastestMover = await findFastestMover(allItems, firstDayOfMonth);
        const kpi = calculateInventoryKPIs(allItems, fastestMover);
        const restockList = generateRestockList(allItems);
        const charts = await calculateChartData(allItems, firstDayOfMonth, sixMonthsAgo);
        const deadStockList = await findDeadStock(allItems, sixMonthsAgo);

        // 3. Response
        res.json({
            kpi,
            restockList,
            deadStockList,
            charts
        });

    } catch (error) {
        console.error('Inventory Report Error:', error);
        res.status(500).json({ message: 'Failed to generate inventory reports' });
    }
});

// --- Helper Functions ---

async function fetchAllInventoryItems() {
    return prisma.inventoryItem.findMany({
        select: {
            id: true,
            name: true,
            quantity: true,
            buyingPrice: true,
            sellingPrice: true,
            lowStockThreshold: true,
            targetStock: true,
            category: true,
            updatedAt: true,
            createdAt: true,
            brand: true
        }
    });
}

function calculateInventoryKPIs(allItems, fastestMover) {
    const inventoryValue = allItems.reduce((sum, item) => sum + (Number(item.buyingPrice) * item.quantity), 0);
    const lowStockCount = allItems.filter(item => item.quantity <= item.lowStockThreshold).length;

    return {
        inventoryValue,
        lowStockCount,
        fastestMover
    };
}

function generateRestockList(allItems) {
    const lowStockItems = allItems.filter(item => item.quantity <= item.lowStockThreshold);
    return lowStockItems.map(item => {
        const maxStock = item.targetStock || (item.lowStockThreshold * RESTOCK_THRESHOLD_MULTIPLIER);
        return {
            id: item.id,
            name: item.name,
            stock: item.quantity,
            maxStock: maxStock,
            costPerUnit: Number(item.buyingPrice),
            selected: false
        };
    });
}

async function findFastestMover(allItems, firstDayOfMonth) {
    const topSellingItems = await prisma.serviceOrderItem.groupBy({
        by: ['inventoryItemId'],
        where: {
            type: 'PART',
            order: { createdAt: { gte: firstDayOfMonth } },
            inventoryItemId: { not: null }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 1
    });

    if (topSellingItems.length > 0 && topSellingItems[0].inventoryItemId) {
        const bestItem = allItems.find(i => i.id === topSellingItems[0].inventoryItemId);
        if (bestItem) {
            return {
                name: bestItem.name,
                count: topSellingItems[0]._sum.quantity
            };
        }
    }
    return { name: "N/A", count: 0 };
}

async function calculateChartData(allItems, firstDayOfMonth, sixMonthsAgo) {
    // A. Top Selling Parts (This Month)
    const topSellingItems = await prisma.serviceOrderItem.groupBy({
        by: ['inventoryItemId'],
        where: {
            type: 'PART',
            order: { createdAt: { gte: firstDayOfMonth } },
            inventoryItemId: { not: null }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
    });

    const topSellingChartLabels = [];
    const topSellingChartData = [];
    for (const ranked of topSellingItems) {
        const item = allItems.find(i => i.id === ranked.inventoryItemId);
        if (item) {
            topSellingChartLabels.push(item.name);
            topSellingChartData.push(ranked._sum.quantity);
        }
    }

    // B. Revenue Distribution (This Month)
    const soldPartsThisMonth = await prisma.serviceOrderItem.findMany({
        where: {
            type: 'PART',
            order: { createdAt: { gte: firstDayOfMonth } },
            inventoryItemId: { not: null }
        },
        include: { inventoryItem: { select: { category: true } } }
    });

    const revenueByCategory = {};
    soldPartsThisMonth.forEach(lineItem => {
        const cat = lineItem.inventoryItem?.category || 'Uncategorized';
        revenueByCategory[cat] = (revenueByCategory[cat] || 0) + Number(lineItem.total);
    });

    // C. Sales Trend (Last 6 Months)
    const recentOrders = await prisma.serviceOrder.findMany({
        where: {
            createdAt: { gte: sixMonthsAgo },
            status: { not: 'CANCELLED' }
        },
        select: { createdAt: true, partsTotal: true }
    });

    const trendMap = {};
    // Initialize
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = MONTH_NAMES[d.getMonth()];
        trendMap[key] = 0;
    }
    // Populate
    recentOrders.forEach(order => {
        const m = MONTH_NAMES[new Date(order.createdAt).getMonth()];
        if (trendMap[m] !== undefined) {
            trendMap[m] += Number(order.partsTotal);
        }
    });

    return {
        topSelling: { labels: topSellingChartLabels, data: topSellingChartData },
        revenueDistribution: { labels: Object.keys(revenueByCategory), data: Object.values(revenueByCategory) },
        salesTrend: { labels: Object.keys(trendMap), data: Object.values(trendMap) }
    };
}

// ... (rest of the file content)

async function findDeadStock(allItems, sixMonthsAgo) {
    const soldItemIdsLast6Months = await prisma.serviceOrderItem.findMany({
        where: {
            type: 'PART',
            inventoryItemId: { not: null },
            order: { createdAt: { gte: sixMonthsAgo } }
        },
        distinct: ['inventoryItemId'],
        select: { inventoryItemId: true }
    });

    const activeItemIds = new Set(soldItemIdsLast6Months.map(i => i.inventoryItemId));
    const now = new Date();

    const preliminaryDeadStock = allItems.filter(item => item.quantity > 0 && !activeItemIds.has(item.id));

    const deadStockWithSales = await Promise.all(
        preliminaryDeadStock.map(async (item) => {
            const lastSale = await prisma.serviceOrderItem.findFirst({
                where: {
                    inventoryItemId: item.id,
                    type: 'PART'
                },
                orderBy: {
                    order: { createdAt: 'desc' }
                },
                include: {
                    order: { select: { createdAt: true } }
                }
            });

            const lastSoldDate = lastSale?.order?.createdAt || null;
            // If never sold, calculate age from creation time (so fresh items don't appear as dead stock)
            // If creation time is missing (legacy), fallback to large number
            const effectiveLastDate = lastSoldDate || item.createdAt || new Date(0);

            const daysSinceSold = Math.floor((now - new Date(effectiveLastDate)) / (1000 * 60 * 60 * 24));

            return {
                id: item.id,
                name: item.name,
                lastSold: lastSoldDate ? lastSoldDate.toISOString().split('T')[0] : 'Never',
                daysSinceSold: daysSinceSold,
                stock: item.quantity
            };
        })
    );

    return deadStockWithSales
        .filter(item => item.daysSinceSold > 180)
        .sort((a, b) => b.daysSinceSold - a.daysSinceSold) // Sort by most stagnant
        .slice(0, 50);
}

/**
     * @route GET /api/inventory/:id
     * @desc Get a single inventory item by ID
     * @access Staff, Admin
     */
router.get('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.inventoryItem.findUnique({
            where: { id: parseInt(id) }
        });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(item);
    } catch (error) {
        console.error('Get Item Error:', error);
        res.status(500).json({ message: 'Failed to fetch item details' });
    }
});

/**
 * @route POST /api/inventory
 * @desc Add a new inventory item
 * @access Staff, Admin
 */
router.post('/', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const {
            name,
            brand,
            category,
            quantity,
            buyingPrice,
            sellingPrice,
            lowStockThreshold,
            imageUrl,
            imageFileId,
            description,
            sku
        } = req.body;

        if (!name || !brand || !buyingPrice || !sellingPrice) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newItem = await prisma.inventoryItem.create({
            data: {
                name,
                brand,
                category: category || 'General',
                quantity: parseInt(quantity) || 0,
                buyingPrice: parseFloat(buyingPrice),
                sellingPrice: parseFloat(sellingPrice),
                lowStockThreshold: parseInt(lowStockThreshold) || 5,
                targetStock: req.body.targetStock ? parseInt(req.body.targetStock) : null,
                imageUrl,
                imageFileId,
                description,
                sku
            }
        });


        res.status(201).json(newItem);
    } catch (error) {
        console.error('Add Inventory Item Error:', error);
        res.status(500).json({ message: 'Failed to add item' });
    }
});
/**
 * @route PUT /api/inventory/:id
 * @desc Update an inventory item
 * @access Staff, Admin
 */
router.put('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Backend: PUT /inventory/${id} body:`, req.body);
        const {
            name,
            brand,
            category,
            quantity,
            buyingPrice,
            sellingPrice,
            lowStockThreshold,
            imageUrl,
            imageFileId,
            description,
            sku
        } = req.body;

        if (!name || !brand || !buyingPrice || !sellingPrice) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const updatedItem = await prisma.inventoryItem.update({
            where: { id: parseInt(id) },
            data: {
                name,
                brand,
                category: category || 'General',
                quantity: parseInt(quantity) || 0,
                buyingPrice: parseFloat(buyingPrice),
                sellingPrice: parseFloat(sellingPrice),
                lowStockThreshold: parseInt(lowStockThreshold) || 5,
                targetStock: req.body.targetStock ? parseInt(req.body.targetStock) : null,
                imageUrl,
                imageFileId,
                description,
                sku
            }
        });

        res.json(updatedItem);
    } catch (error) {
        console.error('Update Inventory Item Error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(500).json({ message: 'Failed to update item' });
    }
});

/**
 * @route PATCH /api/inventory/:id/restock
 * @desc Update stock quantity (Quick Restock)
 * @access Staff, Admin
 */
router.patch('/:id/restock', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body; // Amount to add

        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        const updatedItem = await prisma.inventoryItem.update({
            where: { id: parseInt(id) },
            data: {
                quantity: {
                    increment: parseInt(quantity)
                }
            }
        });

        res.json(updatedItem);
    } catch (error) {
        console.error('Restock Error:', error);
        res.status(500).json({ message: 'Failed to restock item' });
    }
});

/**
 * @route PATCH /api/inventory/:id/target-stock
 * @desc Update target stock level
 * @access Staff, Admin
 */
router.patch('/:id/target-stock', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { targetStock } = req.body;

        if (targetStock === undefined || isNaN(targetStock) || targetStock < 0) {
            return res.status(400).json({ message: 'Invalid target stock value' });
        }

        const updatedItem = await prisma.inventoryItem.update({
            where: { id: parseInt(id) },
            data: {
                targetStock: parseInt(targetStock)
            }
        });

        res.json(updatedItem);
    } catch (error) {
        console.error('Update Target Stock Error:', error);
        res.status(500).json({ message: 'Failed to update target stock' });
    }
});

/**
 * @route POST /api/inventory/bulk-delete
 * @desc Delete multiple inventory items
 * @access Admin
 */
router.post('/bulk-delete', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty IDs list' });
        }

        await prisma.inventoryItem.deleteMany({
            where: {
                id: {
                    in: ids.map(id => parseInt(id))
                }
            }
        });

        res.json({ message: 'Items deleted successfully' });
    } catch (error) {
        console.error('Bulk Delete Error:', error);
        res.status(500).json({ message: 'Failed to delete items' });
    }
});

/**
 * @route DELETE /api/inventory/:id
 * @desc Delete an inventory item
 * @access Admin
 */
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find the item to get the imageFileId
        const item = await prisma.inventoryItem.findUnique({
            where: { id: parseInt(id) }
        });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // 2. Delete image from ImageKit if it exists
        if (item.imageFileId) {
            try {
                await imagekit.deleteFile(item.imageFileId);
                console.log(`Deleted image ${item.imageFileId} for item ${id}`);
            } catch (imageError) {
                console.error('Failed to delete image from ImageKit:', imageError);
                // Continue with item deletion even if image deletion fails
            }
        }

        // 3. Delete the item from database
        await prisma.inventoryItem.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Delete Item Error:', error);
        res.status(500).json({ message: 'Failed to delete item' });
    }
});



/**
 * @route POST /api/inventory/bulk-upload
 * @desc Bulk upload inventory items via CSV
 * @access Admin
 */
const toTitleCase = (str) => {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
};

router.post('/bulk-upload', authenticateToken, authorizeRoles(['admin']), (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            // Cleanup file if it exists (e.g. partial upload or limit reached after file creation)
            if (req.file && req.file.path) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkErr) {
                    console.error('Failed to cleanup file after upload error:', unlinkErr);
                }
            }

            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
                }
                return res.status(400).json({ message: `Upload error: ${err.message}` });
            }

            // An unknown error occurred when uploading.
            return res.status(400).json({ message: err.message });
        }
        // Everything went fine.
        next();
    });
}, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const skipped = [];
    let rowIndex = 0;
    let responseSent = false;

    const stream = fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
            rowIndex++;
            // Basic Validation
            if (!data.Name || !data.Brand || !data['Buying Price'] || !data['Selling Price']) {
                skipped.push({ row: rowIndex, reason: 'Missing required fields', data });
                return;
            }

            // Parse and Validate Numeric Fields
            const buyingPrice = parseFloat(data['Buying Price']);
            const sellingPrice = parseFloat(data['Selling Price']);
            const quantity = parseInt(data.Quantity);
            const lowStockThreshold = parseInt(data['Low Stock Threshold']);

            // Validate Prices (Critical - Skip if invalid)
            if (!Number.isFinite(buyingPrice) || buyingPrice < 0) {
                skipped.push({ row: rowIndex, reason: 'Invalid Buying Price', data });
                return;
            }
            if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
                skipped.push({ row: rowIndex, reason: 'Invalid Selling Price', data });
                return;
            }

            results.push({
                name: toTitleCase(data.Name),
                brand: toTitleCase(data.Brand),
                category: data.Category ? toTitleCase(data.Category) : 'General',
                quantity: Number.isFinite(quantity) && quantity >= 0 ? quantity : 0,
                buyingPrice: buyingPrice,
                sellingPrice: sellingPrice,
                lowStockThreshold: Number.isFinite(lowStockThreshold) && lowStockThreshold > 0 ? lowStockThreshold : 5,
                description: data.Description || '',
                sku: data.SKU || null
            });
        })
        .on('error', (error) => {
            if (responseSent) return;
            responseSent = true;

            console.error('CSV Parsing Error:', error);
            // Cleanup file
            try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
            return res.status(400).json({ message: 'Failed to parse CSV file' });
        })
        .on('end', async () => {
            if (responseSent) return;
            responseSent = true;

            try {
                // Cleanup file
                try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }

                if (results.length === 0) {
                    return res.status(400).json({
                        message: 'No valid items found in CSV',
                        skippedCount: skipped.length,
                        skipped
                    });
                }

                const count = await prisma.inventoryItem.createMany({
                    data: results,
                    skipDuplicates: true // Optional: skip if SKU conflicts
                });

                res.json({
                    message: `Successfully uploaded ${count.count} items`,
                    skippedCount: skipped.length,
                    skipped
                });
            } catch (error) {
                console.error('Bulk Upload Error:', error);
                res.status(500).json({ message: 'Failed to process CSV' });
            }
        });
});


export default router;
