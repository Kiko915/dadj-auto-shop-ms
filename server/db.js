// server/db.js
import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

// Use ES6 'export default'
export default prisma;