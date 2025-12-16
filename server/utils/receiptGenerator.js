import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback logo (Simple SVG DADJ text) if file reading fails
const PRIMARY_LOGO_URL = 'https://i.ibb.co/W4F60Gf0/symbol-w-wordmark-primary.png';
const FALLBACK_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAxMjAgNDAiPjx0ZXh0IHg9IjEwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCIgZm9udC1zaXplPSIzMCIgZmlsbD0iIzBmMTcyYSI+REFESjwvdGV4dD48L3N2Zz4=";

let logoSrc = FALLBACK_LOGO;

try {
    const logoPath = path.join(__dirname, '../../client/public/logo/symbol_w_wordmark_primary.png');
    if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } else {
        console.warn('Receipt Logo not found at:', logoPath);
    }
} catch (error) {
    console.error('Failed to load receipt logo:', error);
}

const escapeHtml = (unsafe) => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function generateReceiptHtml(initialOrder, initialPayment) {
    // 1. Input Validation
    if (!initialOrder || typeof initialOrder !== 'object') {
        console.error('generateReceiptHtml: Invalid or missing order object');
        return '';
    }
    // Safe defaults in case payment is null/undefined
    const payment = initialPayment || { date: null, amount: 0, method: 'N/A' };
    const order = initialOrder;

    // 2. Numeric Coercion & Defaults
    // Ensure we don't get NaN
    const totalAmount = Number.isFinite(Number(order.totalAmount)) ? Number(order.totalAmount) : 0;
    const amountPaidSoFar = Number.isFinite(Number(order.amountPaid)) ? Number(order.amountPaid) : 0;
    const balanceRemaining = Math.max(0, totalAmount - amountPaidSoFar);

    const formatCurrency = (val) => '₱' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Fallback for payment.date
    let paymentDate = 'N/A';
    if (payment && payment.date) {
        try {
            paymentDate = new Date(payment.date).toLocaleDateString();
            if (paymentDate === 'Invalid Date') paymentDate = new Date().toLocaleDateString();
        } catch (e) {
            paymentDate = new Date().toLocaleDateString();
        }
    } else {
        paymentDate = new Date().toLocaleDateString(); // Default to today for fresh receipts
    }

    // 3. Safe Accessors for Nested Properties
    const customer = order.customer || { firstName: 'Guest', lastName: '', phoneNumber: 'N/A' };
    const vehicle = order.vehicle || { make: 'Unknown', model: 'Vehicle', licensePlate: 'N/A' };
    const items = Array.isArray(order.items) ? order.items : [];

    return `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
            
            <div style="background-color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Top Bar -->
                <div style="height: 8px; width: 100%; background: linear-gradient(to right, #0f172a, #334155);"></div>

                <!-- Header -->
                <div style="padding: 30px; border-bottom: 1px solid #f1f5f9;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                                <img src="${PRIMARY_LOGO_URL}" onerror="this.onerror=null; this.src='${logoSrc}'" alt="DADJ Auto Shop" style="height: 48px; width: auto; object-fit: contain;" />
                                <div style="height: 30px; width: 1px; background-color: #e2e8f0; margin: 0 15px;"></div>
                                <div>
                                <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px;">INVOICE</h1>
                                <p style="margin: 2px 0 0; font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">ID: ${escapeHtml(order.id)}</p>
                                </div>
                        </div>
                        <div style="text-align: right; margin-left: 80px;">
                            <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Date Issued</p>
                            <p style="margin: 2px 0 0; font-size: 14px; font-weight: 700; color: #0f172a;">${paymentDate}</p>
                        </div>
                    </div>

                    <!-- Grid -->
                    <table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
                        <tr>
                            <td style="width: 50%; vertical-align: top;">
                                <p style="margin: 0 0 5px; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Bill To</p>
                                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}</p>
                                <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">${escapeHtml(customer.phoneNumber)}</p>
                            </td>
                            <td style="width: 50%; vertical-align: top; text-align: right;">
                                <p style="margin: 0 0 5px; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Vehicle Details</p>
                                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)}</p>
                                <span style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-family: monospace; margin-top: 4px;">${escapeHtml(vehicle.licensePlate)}</span>
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
                            ${items.map(item => `
                            <tr style="border-bottom: 1px solid #f8fafc;">
                                <td style="padding: 12px 30px; vertical-align: top;">
                                    <p style="margin: 0; font-size: 14px; font-weight: 500; color: #334155;">${escapeHtml(item.name)}</p>
                                    <p style="margin: 2px 0 0; font-size: 10px; color: #94a3b8;">${escapeHtml(item.type)} × ${item.quantity} @ ${formatCurrency(item.price)}</p>
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
                    ${(payment.method !== 'UNPAID' && payment.amount > 0) ? `
                    <div style="margin-top: 20px; background-color: #e2e8f0; border-radius: 6px; padding: 15px;">
                        <p style="margin: 0 0 5px; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Payment Received (This Transaction)</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; font-weight: 700; color: #0f172a;">${formatCurrency(payment.amount)}</span>
                            <span style="font-size: 12px; font-weight: 600; color: #475569; background-color: white; padding: 2px 8px; border-radius: 4px; margin-left: 30px;">${escapeHtml(payment.method)} ${payment.referenceNo ? `(#${escapeHtml(payment.referenceNo)})` : ''}</span>
                        </div>
                    </div>
                    ` : ''}


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
    `;
}
