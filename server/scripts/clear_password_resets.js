
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Deleting all PasswordReset records...');
        await prisma.passwordReset.deleteMany({});
        console.log('Successfully deleted all PasswordReset records.');
    } catch (error) {
        console.error('Error deleting records:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
