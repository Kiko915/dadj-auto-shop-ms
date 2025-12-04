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
            console.error('CSV Parsing Error:', error);
            // Cleanup file
            try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
            return res.status(400).json({ message: 'Failed to parse CSV file' });
        })
        .on('end', async () => {
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
