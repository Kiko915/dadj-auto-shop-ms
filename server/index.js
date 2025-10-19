// server/index.js (Using ES6 'import' syntax)

// Load environment variables immediately (ESM compatible way)
import 'dotenv/config'; 

import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js'; // Note the .js extension is often required for ESM

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

// 4. Root Route (Simple Check)
app.get('/', (req, res) => {
    // Use arrow functions and object shorthand
    res.send({ message: 'Express server is running and secure!' });
});


// --- Server Start ---

app.listen(PORT, () => {
    // Use template literals for cleaner console logging
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`Client allowed to connect from: ${corsOptions.origin.join(' | ')}`);
});