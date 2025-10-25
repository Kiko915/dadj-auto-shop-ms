
// routes/vehicle.js - RESTful API for Vehicle Management

import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';

const router = express.Router();

/**
 * @route GET /api/vehicles/customer/:customerId
 * @desc Get all vehicles belonging to a specific customer
 * @access Staff, Admin
 */
router.get('/customer/:customerId', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { customerId } = req.params;
        const vehicles = await prisma.vehicle.findMany({
            where: { customerId },
        });
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve vehicles.' });
    }
});

/**
 * @route GET /api/vehicles/:id
 * @desc Get a single vehicle by its ID
 * @access Staff, Admin
 */
router.get('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found.' });
        }

        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve vehicle.' });
    }
});

/**
 * @route POST /api/vehicles/customer/:customerId
 * @desc Create a new vehicle for a specific customer
 * @access Staff, Admin
 */
router.post('/customer/:customerId', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { customerId } = req.params;
        const { licensePlate, make, model, year, vin, mileage, vehicleType, notes } = req.body;

        const vehicle = await prisma.vehicle.create({
            data: {
                customerId,
                licensePlate,
                make,
                model,
                year,
                vin,
                mileage,
                vehicleType,
                notes,
            },
        });

        res.status(201).json(vehicle);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create vehicle.' });
    }
});

/**
 * @route PUT /api/vehicles/:id
 * @desc Update an existing vehicle record
 * @access Staff, Admin
 */
router.put('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const vehicle = await prisma.vehicle.update({
            where: { id },
            data,
        });

        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update vehicle.' });
    }
});

/**
 * @route DELETE /api/vehicles/:id
 * @desc Delete a vehicle by its ID
 * @access Staff, Admin
 */
router.delete('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.vehicle.delete({
            where: { id },
        });

        res.json({ message: 'Vehicle deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete vehicle.' });
    }
});

export default router;
