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
 * @body {string} firstName - Customer's first name (required)
 * @body {string} lastName - Customer's last name (required)
 * @body {string} [middleName] - Customer's middle name (optional)
 * @body {string} [suffix] - Customer's suffix (optional)
 * @body {string} phoneNumber - Customer's phone number (required)
 * @body {string} email - Customer's email address (required)
 * @body {string} [profilePicture] - ImageKit URL for profile picture (optional)
 * @body {string} [loyaltyStatus] - Loyalty status (optional, defaults to 'regular')
 * @body {number} [totalVehicles] - Total vehicles owned (optional, defaults to 0)
 * @body {string} [notes] - Additional notes (optional)
 * @returns {201} { message: string, customer: Object } - Customer created successfully
 * @returns {400} { message: string, error: 'MISSING_FIELDS' } - Missing required fields
 * @returns {400} { message: string, error: 'INVALID_EMAIL' } - Invalid email format
 * @returns {409} { message: string, error: 'DUPLICATE_EMAIL' } - Email already exists
 * @returns {500} { message: string, error: 'CUSTOMER_ERROR' } - Failed to create customer
 */
router.post('/', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { 
            firstName, 
            lastName, 
            middleName, 
            suffix, 
            phoneNumber, 
            email, 
            profilePicture,
            notes, 
            loyaltyStatus,
            totalVehicles 
        } = req.body;

        // Input Validation
        if (!firstName || !lastName || !phoneNumber || !email) {
            return res.status(400).json({
                message: 'Missing required fields: firstName, lastName, phoneNumber, and email are required',
                error: 'MISSING_FIELDS',
            });
        }

        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({
                message: 'Invalid email format',
                error: 'INVALID_EMAIL',
            });
        }

        // Create Customer
        const newCustomer = await prisma.customer.create({
            data: {
                id: generateCustomerId(), // Generate custom ID with cust- prefix
                firstName,
                lastName,
                middleName: middleName || null,
                suffix: suffix || null,
                phoneNumber,
                email,
                profilePicture: profilePicture || null,
                notes: notes || null,
                loyaltyStatus: loyaltyStatus || 'regular',
                totalVehicles: totalVehicles ? parseInt(totalVehicles) : 0,
            },
        });

        return res.status(201).json({
            message: 'Customer added successfully',
            customer: newCustomer,
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
