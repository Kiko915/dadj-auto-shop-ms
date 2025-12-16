import express from 'express';
import prisma from '../db.js';
import { rateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * @route GET /api/public/track-order
 * @description Track a Service Order by ID and Plate Number (Public Access)
 * @access Public
 */
router.get('/track-order', rateLimiter({ windowMs: 60 * 1000, max: 10 }), async (req, res) => {
    try {
        const { orderId, plateNumber } = req.query;

        // Basic Validation
        if (!orderId || !plateNumber) {
            return res.status(400).json({
                error: 'Please provide both Service Order Reference and Plate Number.'
            });
        }

        // Fetch Order
        // We select minimal fields first to verify the plate
        const order = await prisma.serviceOrder.findUnique({
            where: { id: orderId },
            include: {
                vehicle: {
                    select: {
                        licensePlate: true,
                        make: true,
                        model: true,
                        year: true,
                        color: true
                    }
                }
            }
        });

        // 1. Check if order exists and has valid vehicle info
        if (!order || !order.vehicle?.licensePlate) {
            // Generic error to prevent enumeration
            return res.status(404).json({ error: 'Service Order not found or details incorrect.' });
        }

        // 2. Verify Plate Number (Case Insensitive)
        const dbPlate = order.vehicle.licensePlate.replace(/\s+/g, '').toUpperCase();
        const inputPlate = String(plateNumber).replace(/\s+/g, '').toUpperCase();

        if (dbPlate !== inputPlate) {
            return res.status(404).json({ error: 'Service Order not found or details incorrect.' });
        }

        // 3. Construct Sanitized Response
        const plate = order.vehicle.licensePlate;
        const maskedPlate = plate.length >= 6
            ? plate.slice(0, 3) + '***' + plate.slice(-3)
            : '***';

        const responseData = {
            id: order.id,
            status: order.status,
            createdAt: order.createdAt,
            estimatedCompletion: order.estimatedCompletion,
            totalAmount: Number(order.totalAmount), // decimals properly cast
            amountPaid: Number(order.amountPaid),
            paymentStatus: order.paymentStatus,
            vehicle: {
                make: order.vehicle.make,
                model: order.vehicle.model,
                year: order.vehicle.year,
                color: order.vehicle.color,
                maskedPlate: maskedPlate
            },
            // Don't separate parts/labor details for public view unless requested, 
            // but status is key.
            // We might want step completion logic on backend or frontend. 
            // Frontend can derive steps from status.
        };

        res.json(responseData);

    } catch (error) {
        console.error('Public Track Order Error:', error);
        res.status(500).json({ error: 'Unable to track order at this time.' });
    }
});

export default router;
