// routes/customer.js - RESTful API for Customer Profile Management

import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';
import { generateCustomerId } from '../utils/generateId.js';
import imagekit from '../config/imagekit.js';

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
            birthday,
            profilePicture,
            notes,
            loyaltyStatus,
            totalVehicles,
            imageFileId
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
                birthday: birthday ? new Date(birthday) : null,
                profilePicture: profilePicture || null,
                imageFileId: imageFileId || null,
                notes: notes || null,
                loyaltyStatus: loyaltyStatus ? loyaltyStatus.toLowerCase() : 'regular',
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
        const { search } = req.query;

        const where = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search, mode: 'insensitive' } }
            ];
        }

        const customersData = await prisma.customer.findMany({
            where,
            orderBy: { lastModified: 'desc' },
            include: {
                _count: {
                    select: { vehicles: true }
                }
            }
        });

        const customers = customersData.map(customer => {
            const customerWithCount = {
                ...customer,
                totalVehicles: customer._count.vehicles
            };
            delete customerWithCount._count;
            return customerWithCount;
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

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { vehicles: true }
                }
            }
        });

        if (!customer) {
            return res.status(404).json({
                message: 'Customer not found',
                error: 'NOT_FOUND',
            });
        }

        // Calculate aggregates for service stats
        const stats = await prisma.serviceOrder.aggregate({
            where: {
                customerId: id,
                status: 'COMPLETED'
            },
            _count: { id: true },
            _sum: { totalAmount: true }
        });

        // Map the dynamic count to totalVehicles to ensure accuracy
        customer.totalVehicles = customer._count.vehicles;
        customer.serviceCount = stats._count.id;
        customer.totalSpent = stats._sum.totalAmount || 0;

        delete customer._count;

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
            middleName,
            suffix,
            phoneNumber,
            email,
            notes,
            isActive,
            loyaltyStatus,
            serviceCount,
            totalSpent,
            birthday,
            profilePicture,
            imageFileId,
        } = req.body;

        // Check if the customer exists
        const existingCustomer = await prisma.customer.findUnique({ where: { id } });
        if (!existingCustomer) {
            return res.status(404).json({
                message: 'Customer not found',
                error: 'NOT_FOUND',
            });
        }

        // Delete old profile picture if a new one is being uploaded
        // Delete old profile picture if a new one is being uploaded or removed
        // Condition: existing file exists AND (field is being updated AND update value is different)
        if (existingCustomer.imageFileId && imageFileId !== undefined && imageFileId !== existingCustomer.imageFileId) {
            try {
                await imagekit.deleteFile(existingCustomer.imageFileId);
                console.log(`Deleted old profile picture: ${existingCustomer.imageFileId}`);
            } catch (imageError) {
                console.error('Failed to delete old profile picture from ImageKit:', imageError);
            }
        }

        // Update Customer
        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(middleName !== undefined && { middleName: middleName || null }),
                ...(suffix !== undefined && { suffix: suffix || null }),
                ...(phoneNumber !== undefined && { phoneNumber }),
                ...(email !== undefined && { email }),
                ...(notes !== undefined && { notes: notes || null }),
                ...(typeof isActive === 'boolean' && { isActive }),
                ...(loyaltyStatus !== undefined && { loyaltyStatus: loyaltyStatus.toLowerCase() }),
                ...(typeof serviceCount === 'number' && { serviceCount }),
                ...(typeof totalSpent === 'number' && { totalSpent }),
                ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
                ...(profilePicture !== undefined && { profilePicture: profilePicture || null }),
                ...(imageFileId !== undefined && { imageFileId: imageFileId || null }),
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

/**
 * @route GET /api/customers/:id/service-orders
 * @desc Get all service orders for a specific customer
 * @access Staff, Admin
 * @returns {200} { message: string, serviceOrders: Array }
 */
router.get('/:id/service-orders', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const serviceOrders = await prisma.serviceOrder.findMany({
            where: { customerId: id },
            orderBy: { updatedAt: 'desc' },
            include: {
                vehicle: {
                    select: {
                        id: true,
                        make: true,
                        model: true,
                        licensePlate: true
                    }
                }
            }
        });

        return res.status(200).json({
            message: 'Service orders retrieved successfully',
            serviceOrders
        });
    } catch (error) {
        console.error('Get Customer Service Orders Error:', error);
        return res.status(500).json({
            message: 'Failed to retrieve service orders',
            error: 'SERVER_ERROR'
        });
    }
});

export default router;
