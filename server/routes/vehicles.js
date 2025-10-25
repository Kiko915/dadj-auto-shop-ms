// routes/vehicle.js - RESTful API for Vehicle Management

import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../db.js';

const router = express.Router();

/**
 * @route GET /api/vehicles/customer/:customerId
 * @desc Get all vehicles belonging to a specific customer
 * @access Staff, Admin
 * @returns {200} { message: string, vehicles: Array } - Successfully retrieved list of vehicles
 * @returns {500} { message: string, error: string } - Failed to retrieve vehicles
 */
router.get('/customer/:customerId', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { customerId } = req.params;
        const vehicles = await prisma.vehicle.findMany({
            where: { customerId },
        });

        return res.status(200).json({
            message: 'Vehicles retrieved successfully',
            vehicles,
        });
    } catch (error) {
        console.error('Get Vehicles Error:', error);
        return res.status(500).json({
            message: 'Failed to retrieve vehicles',
            error: 'VEHICLE_ERROR',
        });
    }
});

/**
 * @route GET /api/vehicles/:id
 * @desc Get a single vehicle by its ID
 * @access Staff, Admin
 * @returns {200} { message: string, vehicle: Object } - Successfully retrieved vehicle
 * @returns {404} { message: string, error: 'NOT_FOUND' } - Vehicle not found
 * @returns {500} { message: string, error: string } - Failed to retrieve vehicle
 */
router.get('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });

        if (!vehicle) {
            return res.status(404).json({
                message: 'Vehicle not found',
                error: 'NOT_FOUND',
            });
        }

        return res.status(200).json({
            message: 'Vehicle retrieved successfully',
            vehicle,
        });
    } catch (error) {
        console.error('Get Vehicle Error:', error);
        return res.status(500).json({
            message: 'Failed to retrieve vehicle',
            error: 'VEHICLE_ERROR',
        });
    }
});

/**
 * @route POST /api/vehicles/customer/:customerId
 * @desc Create a new vehicle for a specific customer
 * @access Staff, Admin
 * @returns {201} { message: string, newVehicle: Object } - Vehicle created successfully
 * @returns {400} { message: string, error: 'MISSING_FIELDS' } - Required fields are missing
 * @returns {500} { message: string, error: string } - Failed to create vehicle
 */
router.post('/customer/:customerId', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { customerId } = req.params;
        const { licensePlate, make, model, year, vin, mileage, vehicleType, notes } = req.body;

        // Input Validation
        if (!licensePlate || !make || !model) {
            return res.status(400).json({
                message: 'Missing required fields: licensePlate, make, and model are required',
                error: 'MISSING_FIELDS',
            });
        }

        // Create Vehicle
        const newVehicle = await prisma.vehicle.create({
            data: {
                customerId,
                licensePlate,
                make,
                model,
                year: year ? Number(year) : null,
                vin: vin || null,
                mileage: mileage ? Number(mileage) : null,
                vehicleType: vehicleType || null,
                notes: notes || null,
            },
        });

        return res.status(201).json({
            message: 'Vehicle created successfully',
            newVehicle,
        });
    } catch (error) {
        console.error('Create Vehicle Error:', error);
        return res.status(500).json({
            message: 'Failed to create vehicle',
            error: 'VEHICLE_ERROR',
        });
    }
});

/**
 * @route PUT /api/vehicles/:id
 * @desc Update an existing vehicle record
 * @access Staff, Admin
 * @returns {200} { message: string, updatedVehicle: Object } - Vehicle updated successfully
 * @returns {400} { message: string, error: 'MISSING_FIELDS' } - Required fields are missing
 * @returns {404} { message: string, error: 'NOT_FOUND' } - Vehicle not found
 * @returns {500} { message: string, error: string } - Failed to update vehicle
 */
router.put('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { licensePlate, make, model, year, vin, mileage, vehicleType, notes } = req.body;

        // Input Validation
        if (!licensePlate || !make || !model) {
            return res.status(400).json({
                message: 'Missing required fields: licensePlate, make, and model are required',
                error: 'MISSING_FIELDS',
            });
        }

        // Check if vehicle exists
        const existingVehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!existingVehicle) {
            return res.status(404).json({
                message: 'Vehicle not found',
                error: 'NOT_FOUND',
            });
        }

        // Update Vehicle
        const updatedVehicle = await prisma.vehicle.update({
            where: { id },
            data: {
                licensePlate,
                make,
                model,
                year: year ? Number(year) : null,
                vin: vin || null,
                mileage: mileage ? Number(mileage) : null,
                vehicleType: vehicleType || null,
                notes: notes || null,
            },
        });

        return res.status(200).json({
            message: 'Vehicle updated successfully',
            updatedVehicle,
        });
    } catch (error) {
        console.error('Update Vehicle Error:', error);
        return res.status(500).json({
            message: 'Failed to update vehicle',
            error: 'VEHICLE_ERROR',
        });
    }
});

/**
 * @route DELETE /api/vehicles/:id
 * @desc Delete a vehicle by its ID
 * @access Staff, Admin
 * @returns {200} { message: string, deletedVehicle: Object } - Vehicle deleted successfully
 * @returns {404} { message: string, error: 'NOT_FOUND' } - Vehicle not found
 * @returns {500} { message: string, error: string } - Failed to delete vehicle
 */
router.delete('/:id', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if vehicle exists
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) {
            return res.status(404).json({
                message: 'Vehicle not found',
                error: 'NOT_FOUND',
            });
        }

        await prisma.vehicle.delete({
            where: { id },
        });

        return res.status(200).json({
            message: 'Vehicle deleted successfully',
            deletedVehicle: vehicle,
        });
    } catch (error) {
        console.error('Update Customer Error:', error);
        return res.status(500).json({
            message: 'Failed to delete vehicle',
            error: "VEHICLE_ERROR",
        });
    }
});

export default router;
