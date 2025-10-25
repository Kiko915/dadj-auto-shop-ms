// routes/customer.js - RESTful API for Customer Profile

import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';

const router = express.Router();

/**
 * @route POST /add-customer
 * @desc Add a new customer profile
 * @access Staff, Admin
 */
router.post('/add-customer', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            phoneNumber,
            email,
            notes,
            loyaltyStatus
        } = req.body;

        if (!firstName || !lastName || !phoneNumber) {
            return res.status(400).json({
                message: 'Missing required fields: firstName, lastName, and phoneNumber are required',
                error: 'MISSING_FIELDS',
            });
        }

        const newCustomer = await prisma.customer.create({
            data: {
                firstName,
                lastName,
                phoneNumber,
                email: email || null,
                notes: notes || null,
                loyaltyStatus: loyaltyStatus || 'regular'
            }
        });

        return res.status(201).json({
            message: 'Customer added successfully',
            data: newCustomer,
        });
    } catch (error) {
        console.error('Add Customer Error:', error);

        // Handle Prisma unique constraint errors (Duplicate email)
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(409).json({
                message: 'Email address already exists',
                error: 'DUPLICATE_EMAIL',
            });
        }

        return res.status(500).json({ 
            message: 'Failed to create customer',
            error: 'CUSTOMER_ERROR'
        });
    }
});

/**
 * @route POST /delete-customer
 * @desc Delete an existing customer by ID
 * @access Staff, Admin
 */
router.post('/delete-customer', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({
                message: 'Customer ID is required',
                error: 'MISSING_ID',
            });
        }
        
        const existing_customer = await prisma.customer.findUnique({
            where: id
        });

        if (!existing_customer) {
            return res.status(404).json({
                message: 'Customer not found',
                error: 'NOT_FOUND',
            });
        }

        await prisma.customer.delete({
            where: { id },
        });

        return res.status(200).json({
            message: 'Customer deleted successfully',
            data: { id },
        });
    } catch (error) {
        console.error('Delete Customer Error:', error);
        res.status(500).json({ 
            message: 'Failed to delete customer',
            error: 'CUSTOMER_ERROR'
        });
    }
});

/**
 * @route POST /update-customer
 * @desc Update customer profile details
 * @access Staff, Admin
 */
router.post('/update-customer', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const {
            id,
            firstName,
            lastName,
            phoneNumber,
            email,
            notes,
            isActive,
            loyaltyStatus,
            serviceCount,
            totalSpent
        } = req.body;

        if (!id) {
            return res.status(400).json({
                message: 'Customer ID is required',
                error: 'MISSING_ID',
            });
        }

        const existingCustomer = await prisma.customer.findUnique({
            where: { id },
        });

        if (!existingCustomer) {
            return res.status(404).json({
                message: 'Customer not found',
                error: 'NOT_FOUND',
            });
        }

        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(phoneNumber && { phoneNumber }),
                ...(email && { email }),
                ...(notes && { notes }),
                ...(typeof isActive === 'boolean' && { isActive }),
                ...(loyaltyStatus && { loyaltyStatus }),
                ...(typeof serviceCount === 'number' && { serviceCount }),
                ...(typeof totalSpent === 'number' && { totalSpent }),
            },
        });

        return res.status(200).json({
            message: 'Customer updated successfully',
            data: updatedCustomer,
        });
    } catch (error) {
        console.error('Update Customer Error:', error);

        // Handle unique constraint (duplicate email)
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(409).json({
                message: 'Email address already exists',
                error: 'DUPLICATE_EMAIL',
            });
        }

        res.status(500).json({ 
            message: 'Failed to update customer',
            error: 'CUSTOMER_ERROR'
        });
    }
});

/**
 * @route GET /
 * @desc Get all customers or a single customer by ID (via query param)
 * @access Staff, Admin
 */
router.get('/', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.query;

        if (id) {
            const customer = await prisma.customer.findUnique({
                where: id,
            });

            if (!customer) {
                return res.status(404).json({
                    message: 'Customer not Found',
                    error: 'CUSTOMER_NOT_FOUND'
                })
            }

            return res.status(200).json({
                message: 'Customer retrieved successfully',
                customer
            });
        } else {
            // TODO: Fetch all customer
            const customers = await prisma.customer.findMany({
                orderBy: { lastModified: 'desc' }
            });

            return res.status(500).json({
                message: 'Customers retrieved successfully',
                customers
            });
        }
    } catch (error) {
        console.error('Get Customer Error:', error);
        return res.status(500).json({
            message: 'Failed to fetch customers',
            error: 'CUSTOMER_ERROR'
        });
    }
});

export default router;
