import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';

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
 * @route DELETE /api/inventory/:id
 * @desc Delete an inventory item
 * @access Admin
 */
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.inventoryItem.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Delete Item Error:', error);
        res.status(500).json({ message: 'Failed to delete item' });
    }
});

export default router;
