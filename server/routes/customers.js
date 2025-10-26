// routes/customer.js - RESTful API for Customer Profile Management

import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';
import { generateCustomerId } from '../utils/generateId.js';

const router = express.Router();

/**
 * @route POST /api/customers
 * @desc Add a new customer profile
 * @access Staff, Admin
 * @returns {201} { message: string, newCustomer: Object } - Customer created successfully
 * @returns {400} { message: string, error: 'MISSING_FIELDS' } - Missing required fields
 * @returns {409} { message: string, error: 'DUPLICATE_EMAIL' } - Email already exists
 * @returns {500} { message: string, error: 'CUSTOMER_ERROR' } - Failed to create customer
 */
router.post('/', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, email, notes, loyaltyStatus } = req.body;

        // Input Validation
        if (!firstName || !lastName || !phoneNumber) {
            return res.status(400).json({
                message: 'Missing required fields: firstName, lastName, and phoneNumber are required',
                error: 'MISSING_FIELDS',
            });
        }

        // Create Customer
        const newCustomer = await prisma.customer.create({
            data: {
                id: generateCustomerId(), // Generate custom ID with cust- prefix
                firstName,
                lastName,
                phoneNumber,
                email: email || null,
                notes: notes || null,
                loyaltyStatus: loyaltyStatus || 'regular',
            },
        });

        return res.status(201).json({
            message: 'Customer added successfully',
            newCustomer,
        });
    } catch (error) {
        console.error('Add Customer Error:', error);

        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(409).json({
                message: 'Email address already exists',
                error: 'DUPLICATE_EMAIL',
            });
        }

        return res.status(500).json({
            message: 'Failed to create customer',
            error: 'CUSTOMER_ERROR',
        });
    }
});

/**
 * @route GET /api/customers
 * @desc Retrieve all customers from the database
 * @access Staff, Admin
 * @returns {200} { message: string, customers: Array } - Successfully retrieved customers
 * @returns {500} { message: string, error: string } - Failed to fetch customers
 */
router.get('/', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { lastModified: 'desc' },
        });

        return res.status(200).json({
            message: 'Customers retrieved successfully',
            customers,
        });
    } catch (error) {
        console.error('Get Customers Error:', error);
        return res.status(500).json({
            message: 'Failed to fetch customers',
            error: 'CUSTOMER_ERROR',
        });
    }
});

/**
 * @route GET /api/customers/:id
 * @desc Get a single customer by ID
 * @access Staff, Admin
 * @returns {200} { message: string, customer: Object } - Customer retrieved successfully
 * @returns {404} { message: string, error: 'NOT_FOUND' } - Customer not found
 * @returns {500} { message: string, error: string } - Failed to retrieve customer
 */
router.get('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer) {
            return res.status(404).json({
                message: 'Customer not found',
                error: 'NOT_FOUND',
            });
        }

        return res.status(200).json({
            message: 'Customer retrieved successfully',
            customer,
        });
    } catch (error) {
        console.error('Get Customer Error:', error);
        return res.status(500).json({
            message: 'Failed to retrieve customer',
            error: 'CUSTOMER_ERROR',
        });
    }
});

/**
 * @route PUT /api/customers/:id
 * @desc Update an existing customer's information
 * @access Staff, Admin
 * @returns {200} { message: string, updatedCustomer: Object } - Customer updated successfully
 * @returns {400} { message: string, error: 'MISSING_ID' } - Missing ID
 * @returns {404} { message: string, error: 'NOT_FOUND' } - Customer not found
 * @returns {409} { message: string, error: 'DUPLICATE_EMAIL' } - Email already exists
 * @returns {500} { message: string, error: string } - Failed to update customer
 */
router.put('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            firstName,
            lastName,
            phoneNumber,
            email,
            notes,
            isActive,
            loyaltyStatus,
            serviceCount,
            totalSpent,
        } = req.body;

        // Check if the customer exists
        const existingCustomer = await prisma.customer.findUnique({ where: { id } });
        if (!existingCustomer) {
            return res.status(404).json({
                message: 'Customer not found',
                error: 'NOT_FOUND',
            });
        }

        // Update Customer
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
            updatedCustomer,
        });
    } catch (error) {
        console.error('Update Customer Error:', error);

        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(409).json({
                message: 'Email address already exists',
                error: 'DUPLICATE_EMAIL',
            });
        }

        return res.status(500).json({
            message: 'Failed to update customer',
            error: 'CUSTOMER_ERROR',
        });
    }
});

/**
 * @route DELETE /api/customers/:id
 * @desc Delete a customer by ID
 * @access Staff, Admin
 * @returns {200} { message: string, deletedCustomer: Object } - Customer deleted successfully
 * @returns {404} { message: string, error: 'NOT_FOUND' } - Customer not found
 * @returns {500} { message: string, error: string } - Failed to delete customer
 */
router.delete('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const existingCustomer = await prisma.customer.findUnique({ where: { id } });
        if (!existingCustomer) {
            return res.status(404).json({
                message: 'Customer not found',
                error: 'NOT_FOUND',
            });
        }

        const deletedCustomer = await prisma.customer.delete({ where: { id } });

        return res.status(200).json({
            message: 'Customer deleted successfully',
            deletedCustomer,
        });
    } catch (error) {
        console.error('Delete Customer Error:', error);
        return res.status(500).json({
            message: 'Failed to delete customer',
            error: 'CUSTOMER_ERROR',
        });
    }
});

export default router;
