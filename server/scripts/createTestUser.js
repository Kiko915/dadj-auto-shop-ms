import bcrypt from 'bcrypt';
import prisma from '../db.js';

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@synera.com',
        password: hashedPassword,
        role: 'STAFF',
        isActive: true
      }
    });
    
    console.log('Test user created successfully:', {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    
    console.log('You can now login with:');
    console.log('Email: test@synera.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();