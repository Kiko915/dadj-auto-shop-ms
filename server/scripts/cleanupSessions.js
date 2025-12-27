// Clean up all sessions from the database
import prisma from '../db.js';

async function cleanupSessions() {
  try {
    console.log('🧹 Cleaning up all sessions...');
    
    const result = await prisma.userSession.deleteMany({});
    
    console.log(`✅ Deleted ${result.count} session(s)`);
    console.log('✨ Database is clean! You can now login fresh.');
    
  } catch (error) {
    console.error('❌ Error cleaning up sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSessions();
