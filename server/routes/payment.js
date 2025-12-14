import express from 'express';
import prisma from '../db.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// POST /api/payments
router.post('/', async (req, res) => {
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

        // Allow a small margin of error for floating point comparison if needed, but assuming strict for now
        if (paymentAmount > currentBalance + 0.01) { // +0.01 tolerance
            return res.status(400).json({ error: 'Payment amount exceeds balance' });
        }

        // 2. Process Payment in Transaction
        const result = await prisma.$transaction(async (tx) => {
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
            const newAmountPaid = Number(order.amountPaid) + paymentAmount;

            // Determine Status
            let newStatus = 'PARTIAL';
            if (newAmountPaid >= Number(order.totalAmount) - 0.01) {
                newStatus = 'PAID';
            } else if (newAmountPaid === 0) {
                newStatus = 'UNPAID';
            }

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
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASSWORD
                        },
                        tls: {
                            rejectUnauthorized: false
                        }
                    });

                    // Recalculate based on updated values
                    const totalAmount = Number(order.totalAmount);
                    const amountPaidSoFar = Number(result.updatedOrder.amountPaid);
                    const balanceRemaining = Math.max(0, totalAmount - amountPaidSoFar);

                    // Format utils
                    const formatCurrency = (val) => '₱' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

                    const mailOptions = {
                        from: process.env.EMAIL_USER || 'noreply@dadjauto.shop',
                        to: order.customer.email,
                        subject: `Invoice Receipt - Service Order #${orderId}`,
                        html: `
                            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
                                
                                <div style="background-color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                    
                                    <!-- Top Bar -->
                                    <div style="height: 8px; width: 100%; background: linear-gradient(to right, #0f172a, #334155);"></div>

                                    <!-- Header -->
                                    <div style="padding: 30px; border-bottom: 1px solid #f1f5f9;">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                            <div style="display: flex; align-items: center; gap: 15px;">
                                                 <img src="https://i.ibb.co/W4F60Gf0/symbol-w-wordmark-primary.png" alt="DADJ Logo" style="height: 48px; width: auto; object-fit: contain;" />
                                                 <div style="height: 30px; width: 1px; background-color: #e2e8f0; margin: 0 15px;"></div>
                                                 <div>
                                                    <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px;">INVOICE</h1>
                                                    <p style="margin: 2px 0 0; font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">ID: ${orderId}</p>
                                                 </div>
                                            </div>
                                            <div style="text-align: right; margin-left: 80px;">
                                                <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Date Issued</p>
                                                <p style="margin: 2px 0 0; font-size: 14px; font-weight: 700; color: #0f172a;">${todayDate}</p>
                                            </div>
                                        </div>

                                        <!-- Grid -->
                                        <table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
                                            <tr>
                                                <td style="width: 50%; vertical-align: top;">
                                                    <p style="margin: 0 0 5px; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Bill To</p>
                                                    <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">${order.customer.firstName} ${order.customer.lastName}</p>
                                                    <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">${order.customer.phoneNumber}</p>
                                                </td>
                                                <td style="width: 50%; vertical-align: top; text-align: right;">
                                                    <p style="margin: 0 0 5px; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Vehicle Details</p>
                                                    <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">${order.vehicle.make} ${order.vehicle.model}</p>
                                                    <span style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-family: monospace; margin-top: 4px;">${order.vehicle.licensePlate}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                    <!-- Items Table -->
                                    <div style="padding: 0;">
                                        <table style="width: 100%; border-collapse: collapse;">
                                            <thead>
                                                <tr style="background-color: #f8fafc; border-bottom: 1px solid #f1f5f9;">
                                                    <th style="padding: 12px 30px; text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Item Description</th>
                                                    <th style="padding: 12px 30px; text-align: right; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${order.items.map(item => `
                                                <tr style="border-bottom: 1px solid #f8fafc;">
                                                    <td style="padding: 12px 30px; vertical-align: top;">
                                                        <p style="margin: 0; font-size: 14px; font-weight: 500; color: #334155;">${item.name}</p>
                                                        <p style="margin: 2px 0 0; font-size: 10px; color: #94a3b8;">${item.type} × ${item.quantity} @ ${formatCurrency(item.price)}</p>
                                                    </td>
                                                    <td style="padding: 12px 30px; text-align: right; vertical-align: top; font-family: monospace; font-size: 14px; color: #334155;">
                                                        ${formatCurrency(item.total)}
                                                    </td>
                                                </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>

                                    <!-- Summary Footer -->
                                    <div style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #f1f5f9;">
                                        
                                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                                            <tr>
                                                <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Labor Subtotal</td>
                                                <td style="padding: 4px 0; text-align: right; font-family: monospace; color: #334155;">${formatCurrency(order.laborTotal)}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Parts & Materials</td>
                                                <td style="padding: 4px 0; text-align: right; font-family: monospace; color: #334155;">${formatCurrency(order.partsTotal)}</td>
                                            </tr>
                                        </table>

                                        <div style="height: 1px; width: 100%; background-color: #e2e8f0; margin: 10px 0;"></div>

                                        <table style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 700;">Total Amount</td>
                                                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 18px; font-weight: 700; color: #0f172a;">${formatCurrency(order.totalAmount)}</td>
                                            </tr>
                                            ${amountPaidSoFar > 0 ? `
                                            <tr>
                                                <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 500;">✓ Paid so far</td>
                                                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 14px; font-weight: 700; color: #10b981;">- ${formatCurrency(amountPaidSoFar)}</td>
                                            </tr>
                                            ` : ''}
                                        </table>

                                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
                                            <table style="width: 100%;">
                                                <tr>
                                                    <td style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Total Due Now</td>
                                                    <td style="text-align: right; font-family: monospace; font-size: 24px; font-weight: 900; color: #0f172a;">${formatCurrency(balanceRemaining)}</td>
                                                </tr>
                                            </table>
                                        </div>

                                        <!-- Payment Info Box -->
                                        <div style="margin-top: 20px; background-color: #e2e8f0; border-radius: 6px; padding: 15px;">
                                            <p style="margin: 0 0 5px; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Payment Received</p>
                                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                                <span style="font-size: 14px; font-weight: 700; color: #0f172a;">${formatCurrency(paymentAmount)}</span>
                                                <span style="font-size: 12px; font-weight: 600; color: #475569; background-color: white; padding: 2px 8px; border-radius: 4px; margin-left: 30px;">${method} ${referenceNo ? `(#${referenceNo})` : ''}</span>
                                            </div>
                                        </div>

                                    </div>

                                    <!-- Bottom Branding -->
                                    <div style="background-color: #0f172a; padding: 15px; text-align: center;">
                                        <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">DADJ Auto Shop Management System</p>
                                    </div>

                                </div>
                                
                                <div style="text-align: center; margin-top: 20px;">
                                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">This is an automated email. Please do not reply.</p>
                                </div>

                            </div>
                        `
                    };

                    await transporter.sendMail(mailOptions);
                    console.log(`Receipt email sent to ${order.customer.email}`);

                } catch (emailError) {
                    console.error('Failed to send receipt email:', emailError);
                    // Do not fail the request, just log it
                }
            })();
        }

        res.json(result);

    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
});

export default router;
