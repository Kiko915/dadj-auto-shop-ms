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
        // TODO: Implement database insertion logic
        res.status(501).json({
            message: 'TODO: Aron - implement add customer logic',
            error: 'NOT_IMPLEMENTED',
        });
    } catch (error) {
        console.error('Add Customer Error:', error);
        res.status(500).json({ 
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
        // TODO: Implement deletion logic (e.g. prisma.customer.delete)
        res.status(501).json({
            message: 'TODO: Aron - implement delete customer logic',
            error: 'NOT_IMPLEMENTED',
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
        // TODO: Implement update logic (e.g. prisma.customer.update)
        res.status(501).json({
            message: 'TODO: Aron - implement update customer logic',
            error: 'NOT_IMPLEMENTED',
        });
    } catch (error) {
        console.error('Update Customer Error:', error);
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
            // TODO: Implement single customer retrieval
            res.status(501).json({
                message: 'TODO: Aron - implement get single customer logic',
                error: 'NOT_IMPLEMENTED',
            });
        } else {
            // TODO: Implement all customers retrieval
            res.status(501).json({
                message: 'TODO: Aron - implement get all customers logic',
                error: 'NOT_IMPLEMENTED',
            });
        }
    } catch (error) {
        console.error('Get Customer Error:', error);
        res.status(500).json({
            message: 'Failed to fetch customers',
            error: 'CUSTOMER_ERROR'
        });
    }
});

export default router;
