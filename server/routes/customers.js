// routes/customer.js - RESTful API for Customer Profile

import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';

const router = express.Router();

/**
 * @route POST /api/customers/add-customer
 * @desc Add a new customer profile
 * @access Staff, Admin
 * @body {string} id - The unique customer ID (cuid)
 * @returns {object} Confirmation of deletion or error message
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
        
        // Input Validation
        if (!firstName || !lastName || !phoneNumber) {
            return res.status(400).json({
                message: 'Missing required fields: firstName, lastName, and phoneNumber are required',
                error: 'MISSING_FIELDS',
            });
        }

        // Creates the User
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
            newCustomer,
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
 * @route POST /api/customers/delete-customer
 * @desc Delete an existing customer by ID
 * @access Staff, Admin
 * @body {string} id - The unique customer ID (cuid)
 * @returns {object} Confirmation of deletion or error message
 */
router.post('/delete-customer', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.body;

        // Check if an ID is Provided
        if (!id) {
            return res.status(400).json({
                message: 'Customer ID is required',
                error: 'MISSING_ID',
            });
        }
        
        // Check if the user exist
        const existing_customer = await prisma.customer.findUnique({
            where: id
        });

        if (!existing_customer) {
            return res.status(404).json({
                message: 'Customer not found',
                error: 'NOT_FOUND',
            });
        }

        // Delete the User
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
 * @route POST api/customers/update-customer
 * @desc Update an existing customer's information
 * @access Staff, Admin
 * @body {string} id - The unique customer ID (cuid)
 * @body {string} [firstName] - Updated first name
 * @body {string} [lastName] - Updated last name
 * @body {string} [phoneNumber] - Updated phone number
 * @body {string} [email] - Updated email (must remain unique)
 * @body {string} [notes] - Updated notes
 * @body {boolean} [isActive] - Active/inactive status
 * @body {string} [loyaltyStatus] - Updated loyalty status (regular, silver, gold, platinum)
 * @body {number} [serviceCount] - Updated service count
 * @body {number} [totalSpent] - Updated total amount spent
 * @returns {object} The updated customer record
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

        // Check if an ID Is Provided
        if (!id) {
            return res.status(400).json({
                message: 'Customer ID is required',
                error: 'MISSING_ID',
            });
        }

        // Check if the user exist
        const existingCustomer = await prisma.customer.findUnique({
            where: { id },
        });

        if (!existingCustomer) {
            return res.status(404).json({
                message: 'Customer not found',
                error: 'NOT_FOUND',
            });
        }

        // Update the necessary fields/given by the client
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
 * @route GET /api/customers
 * @desc Retrieve customers from the database. If an ID is provided, fetch a single customer; otherwise, return all customers.
 * @access Staff, Admin
 * @query {string} [id] - Optional customer ID to fetch a specific record
 * @returns {object|array} Customer data or a list of all customers
 * @example
 * // Get all customers
 * GET /customers
 * 
 * // Get one customer
 * GET /customers?id=clxyz123456789
 */
router.get('/', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.query;

        if (id) {
            // Fetch Single Customer
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
            // Fetch all customer
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
