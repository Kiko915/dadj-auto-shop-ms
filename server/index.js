// server/index.js (Using ES6 'import' syntax)

// Load environment variables immediately (ESM compatible way)
import 'dotenv/config';

import * as Sentry from '@sentry/node';

import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js'; // Note the .js extension is often required for ESM
import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';
import customerRoutes from './routes/customers.js';
import vehicleRoutes from './routes/vehicles.js'
import inventoryRoutes from './routes/inventory.js'
import filesRoutes from './routes/files.js'

import estimateRoutes from './routes/estimates.js';
import usersRoutes from './routes/users.js';
import serviceRoutes from './routes/service-orders.js';
import paymentRoutes from './routes/payment.js';
import financialReports from './routes/financial-reports.js';

// --- Initialization ---
const app = express();
// Use const for variables
const PORT = process.env.PORT || 4000;

// --- Configuration ---

// 1. CORS Middleware
const corsOptions = {
    // Defined once using const/let
    origin: ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};
app.use(cors(corsOptions));

// 2. Body Parser Middleware
app.use(express.json());


// --- Routing ---

// 3. Define Main API Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/estimates', estimateRoutes);
app.use('/api/service-orders', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/reports', financialReports);

app.listen(PORT, () => {
    // Use template literals for cleaner console logging
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`Client allowed to connect from: ${corsOptions.origin.join(' | ')}`);
});