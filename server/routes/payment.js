import express from 'express';
import prisma from '../db.js';
import { generateReceiptHtml } from '../utils/receiptGenerator.js';

import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { getMailgunClient } from '../utils/mailer.js';

const router = express.Router();

// POST /api/payments
router.post('/', authenticateToken, authorizeRoles(['admin', 'staff']), async (req, res) => {
    try {
        const { orderId, amount, method, referenceNo } = req.body;

        if (!orderId || !amount || !method) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const paymentAmount = Number(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // 1. Fetch Order to check balance
        const order = await prisma.serviceOrder.findUnique({
            where: { id: orderId },
            include: {
                customer: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true
                    }
                },
                vehicle: {
                    select: {
                        make: true,
                        model: true,
                        licensePlate: true
                    }
                },
                items: true // Fetch items for the receipt
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const currentBalance = Number(order.totalAmount) - Number(order.amountPaid);


        // 2. Process Payment in Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Re-fetch order inside transaction for atomicity
            const freshOrder = await tx.serviceOrder.findUnique({
                where: { id: orderId },
                select: { totalAmount: true, amountPaid: true }
            });

            const currentBalance = Number(freshOrder.totalAmount) - Number(freshOrder.amountPaid);
            if (paymentAmount > currentBalance + 0.01) {
                throw new Error('Payment amount exceeds balance');
            }

            // Create Payment Record
            const payment = await tx.payment.create({
                data: {
                    orderId,
                    amount: paymentAmount,
                    method, // CASH, GCASH, etc.
                    referenceNo: referenceNo || null,
                    date: new Date()
                }
            });

            // Calculate new totals
            const newAmountPaid = Number(freshOrder.amountPaid) + paymentAmount;

            // Determine Status
            const newStatus = (newAmountPaid >= Number(freshOrder.totalAmount) - 0.01) ? 'PAID' : 'PARTIAL';

            // Update Service Order
            const updatedOrder = await tx.serviceOrder.update({
                where: { id: orderId },
                data: {
                    amountPaid: newAmountPaid,
                    paymentStatus: newStatus
                }
            });

            return { payment, updatedOrder };
        });

        // 3. Send Receipt Email (Fire and Forget - don't block response)
        // Only attempt if customer has an email
        if (order.customer?.email) {
            (async () => {
                try {
                    const mailer = await getMailgunClient();

                    if (!mailer) {
                        console.warn(`Skipping receipt email for orderId=${orderId}: email service unavailable`);
                        return;
                    }

                    const { client, domain } = mailer;

                    // Format utils
                    const emailData = {
                        from: process.env.EMAIL_USER || `DADJ Auto Shop <postmaster@${domain}>`,
                        to: [order.customer.email],
                        subject: `Invoice Receipt - Service Order #${orderId}`,
                        html: generateReceiptHtml(order, {
                            amount: paymentAmount,
                            method,
                            referenceNo,
                            date: new Date()
                        })
                    };

                    await client.messages.create(domain, emailData);
                    console.log(`Receipt email sent for orderId=${orderId}`);

                } catch (emailError) {
                    console.error(`Failed to send receipt email for orderId=${orderId}:`, emailError);
                    // Do not fail the request, just log it
                }
            })();
        }

        res.json(result);

    } catch (error) {
        console.error('Payment processing error:', error);
        if (error.message === 'Payment amount exceeds balance') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to process payment' });
    }
});

// GET /api/payments (List all payments)
router.get('/', authenticateToken, authorizeRoles(['admin', 'staff']), async (req, res) => {
    try {
        const { page = '1', limit = '10' } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ message: 'Invalid page number' });
        }
        if (isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ message: 'Invalid limit number' });
        }

        // Enforce max limit to prevent fetching too many records
        const sanitizedLimit = Math.min(limitNum, 100);
        const skip = (pageNum - 1) * sanitizedLimit;

        const [payments, total] = await prisma.$transaction([
            prisma.payment.findMany({
                include: {
                    order: {
                        select: {
                            id: true,
                            customer: {
                                select: { firstName: true, lastName: true }
                            },
                            vehicle: {
                                select: { licensePlate: true }
                            }
                        }
                    }
                },
                orderBy: { date: 'desc' },
                skip,
                take: sanitizedLimit
            }),
            prisma.payment.count()
        ]);

        res.json({
            items: payments,
            totalItems: total,
            totalPages: Math.ceil(total / sanitizedLimit),
            currentPage: pageNum
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// GET /api/payments/:id/receipt (View Receipt)
router.get('/:id/receipt', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        customer: true,
                        vehicle: true,
                        items: true
                    }
                }
            }
        });

        if (!payment) return res.status(404).send('Payment not found');

        // Authorization: Admin/Staff or the Customer who owns the order
        const isStaffOrAdmin = ['admin', 'staff'].includes(req.user.role);
        const isOwner = req.user.id === payment.order.customerId;

        if (!isStaffOrAdmin && !isOwner) {
            return res.status(403).send('Unauthorized access to receipt');
        }

        const html = generateReceiptHtml(payment.order, payment);
        res.send(html);

    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).send('Failed to generate receipt');
    }
});

export default router;
