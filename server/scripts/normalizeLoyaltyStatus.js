import prisma from '../db.js';

async function normalizeLoyaltyStatus() {
  try {
    console.log('Starting loyalty status normalization...');

    // Get all customers
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        loyaltyStatus: true,
      },
    });

    console.log(`Found ${customers.length} customers to check`);

    let updatedCount = 0;

    // Update each customer's loyalty status to lowercase
    for (const customer of customers) {
      if (customer.loyaltyStatus) {
        const normalizedStatus = customer.loyaltyStatus.toLowerCase();
        
        // Only update if the status is not already lowercase
        if (customer.loyaltyStatus !== normalizedStatus) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { loyaltyStatus: normalizedStatus },
          });
          
          console.log(`Updated customer ${customer.id}: "${customer.loyaltyStatus}" → "${normalizedStatus}"`);
          updatedCount++;
        }
      }
    }

    console.log(`\n✅ Normalization complete!`);
    console.log(`Total customers: ${customers.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Already normalized: ${customers.length - updatedCount}`);

  } catch (error) {
    console.error('❌ Error normalizing loyalty status:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
normalizeLoyaltyStatus();
