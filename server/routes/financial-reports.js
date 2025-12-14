import express from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET /api/reports/billing-stats
// Returns daily revenue, active invoices count, receivables amount
router.get('/billing-stats', authenticateToken, authorizeRoles(['admin', 'staff']), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Daily Revenue (Sum of payments made today)
        const dailyRevenueResult = await prisma.payment.aggregate({
            _sum: {
                amount: true
            },
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });
        const dailyRevenue = dailyRevenueResult._sum.amount || 0;

        // 2. Receivables (Sum of remaining balance on UNPAID/PARTIAL orders)
        // We need to fetch all non-paid orders and sum (total - paid)
        // Prisma aggregate doesn't support computed fields easily, so we fetch standard fields
        // Optimization: Filter by paymentStatus != PAID
        const unpaidOrders = await prisma.serviceOrder.findMany({
            where: {
                paymentStatus: {
                    not: 'PAID'
                },
                status: {
                    not: 'CANCELLED' // Don't count cancelled orders
                }
            },
            select: {
                totalAmount: true,
                amountPaid: true
            }
        });

        const receivables = unpaidOrders.reduce((sum, order) => {
            const balance = Number(order.totalAmount) - Number(order.amountPaid);
            return sum + (balance > 0 ? balance : 0);
        }, 0);

        // 3. Active Invoices (Count of orders with status NOT Paid and NOT Cancelled)
        const activeInvoices = unpaidOrders.length;

        // 4. Digital Payments Today (GCash / Other)
        const digitalPaymentsResult = await prisma.payment.aggregate({
            _sum: {
                amount: true
            },
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                },
                method: {
                    not: 'CASH'
                }
            }
        });
        const digitalPayments = digitalPaymentsResult._sum.amount || 0;

        res.json({
            dailyRevenue,
            receivables,
            activeInvoices,
            digitalPayments
        });

    } catch (error) {
        console.error('Error fetching billing stats:', error);
        res.status(500).json({ error: 'Failed to fetch billing stats' });
    }
});

// GET /api/reports/daily
// Generates a daily financial report (HTML or CSV)
router.get('/daily', authenticateToken, authorizeRoles(['admin', 'staff']), async (req, res) => {
    try {
        const { format = 'json' } = req.query; // 'html' | 'csv' | 'json'

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch all payments for today
        const payments = await prisma.payment.findMany({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                }
            },
            include: {
                order: {
                    select: {
                        id: true,
                        customer: { select: { firstName: true, lastName: true } }
                    }
                }
            },
            orderBy: { date: 'asc' }
        });

        // Calculate Totals
        const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const methodBreakdown = payments.reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + Number(p.amount);
            return acc;
        }, {});

        // --- CSV FORMAT ---
        if (format === 'csv') {
            const headers = ['Date', 'Time', 'Order ID', 'Customer', 'Method', 'Reference', 'Amount'];
            const rows = payments.map(p => {
                const d = new Date(p.date);
                return [
                    d.toLocaleDateString(),
                    d.toLocaleTimeString(),
                    p.orderId,
                    `"${p.order?.customer?.firstName} ${p.order?.customer?.lastName}"`, // Quote for safety
                    p.method,
                    `"${p.referenceNo || ''}"`,
                    Number(p.amount).toFixed(2)
                ].join(',');
            });

            const csvString = [headers.join(','), ...rows].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="daily_report_${today.toISOString().split('T')[0]}.csv"`);
            return res.send(csvString);
        }

        // --- HTML FORMAT ---
        if (format === 'html') {
            const formatCurrency = (val) => '₱' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            // Load Logo
            let logoBase64 = '';
            try {
                // Resolve path relative to this file (server/routes/financial-reports.js)
                // Go up two levels (routes -> server -> root) then into client/public/logo
                const logoPath = path.join(__dirname, '../../client/public/logo/symbol_w_wordmark_primary.png');
                console.log('Attempting to load logo from:', logoPath);

                if (fs.existsSync(logoPath)) {
                    const logoBuffer = fs.readFileSync(logoPath);
                    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
                } else {
                    console.error('Logo file not found at:', logoPath);
                }
            } catch (err) {
                console.error('Error loading logo:', err);
            }

            const rowsHtml = payments.map((p, index) => `
                <tr style="background-color: ${index % 2 === 0 ? 'white' : '#f9fafb'};">
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${new Date(p.date).toLocaleTimeString()}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${p.orderId}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 500;">${p.order?.customer?.firstName} ${p.order?.customer?.lastName}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
                        <span style="padding: 2px 6px; border-radius: 4px; background: #eff6ff; color: #1e40af; font-size: 10px; font-weight: 600;">${p.method}</span>
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">${p.referenceNo || '-'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: right; font-family: monospace;">${formatCurrency(p.amount)}</td>
                </tr>
            `).join('');

            const breakdownHtml = Object.entries(methodBreakdown).map(([method, amount]) => `
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                    <span style="color: #4b5563;">${method}:</span>
                    <span style="font-weight: 600;">${formatCurrency(amount)}</span>
                </div>
            `).join('');

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Daily Report - ${dateStr}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 20px; background: #f3f4f6; }
                        .paper { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                        @media print {
                            body { background: white; padding: 0; }
                            .paper { box-shadow: none; padding: 0; max-width: 100%; margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="no-print" style="max-width: 800px; margin: 0 auto 20px; text-align: right;">
                        <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500;">Print Report / Save PDF</button>
                    </div>
                    <div class="paper">
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
                            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="height: 60px; margin-bottom: 15px;">` : ''}
                            <h1 style="margin: 0; font-size: 24px; color: #111827; text-transform: uppercase;">Daily Financial Report</h1>
                            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">${dateStr}</p>
                            <p style="margin: 5px 0 0; color: #9ca3af; font-size: 12px;">Generated by DADJ Auto Shop MS</p>
                        </div>

                        <!-- Summary Cards -->
                        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                            <div style="flex: 1; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1;">
                                <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #64748b;">Total Revenue</h3>
                                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a;">${formatCurrency(totalRevenue)}</p>
                            </div>
                            <div style="flex: 1; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1;">
                                <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #64748b;">Breakdown</h3>
                                ${breakdownHtml}
                            </div>
                        </div>

                        <!-- Transactions Table -->
                        <h3 style="font-size: 16px; margin-bottom: 10px; color: #374151;">Detailed Transactions</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                            <thead>
                                <tr style="background: #f3f4f6; color: #374151;">
                                    <th style="padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Time</th>
                                    <th style="padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Order ID</th>
                                    <th style="padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Customer</th>
                                    <th style="padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Method</th>
                                    <th style="padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Reference</th>
                                    <th style="padding: 10px 8px; text-align: right; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>

                        <!-- Signature -->
                        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
                            <div style="width: 200px; text-align: center;">
                                <div style="border-bottom: 1px solid #9ca3af; height: 1px; margin-bottom: 10px;"></div>
                                <p style="margin: 0; font-size: 12px; color: #4b5563;">Prepared By</p>
                            </div>
                            <div style="width: 200px; text-align: center;">
                                <div style="border-bottom: 1px solid #9ca3af; height: 1px; margin-bottom: 10px;"></div>
                                <p style="margin: 0; font-size: 12px; color: #4b5563;">Verified By</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(html);
        }

        // --- JSON FORMAT ---
        res.json({
            date: today,
            totalRevenue,
            methodBreakdown,
            payments
        });

    } catch (error) {
        console.error('Error generating daily report:', error);
        res.status(500).json({ error: 'Failed to generate daily report' });
    }
});

export default router;
