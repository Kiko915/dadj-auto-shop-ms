// Script to fix loyalty status casing in existing customer records
import prisma from '../db.js';

async function fixLoyaltyStatusCasing() {
  try {
    console.log('Starting loyalty status casing fix...\n');

    // Mapping of lowercase to capitalized values
    const statusMapping = {
      'regular': 'Regular',
      'loyal': 'Loyal',
      'vip': 'VIP',
      'silver': 'Loyal',  // Map silver to Loyal if needed
      'gold': 'VIP',      // Map gold to VIP if needed
      'platinum': 'VIP'   // Map platinum to VIP if needed
    };

    // Get all customers
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        loyaltyStatus: true,
      },
    });

    console.log(`Found ${customers.length} customers\n`);

    let updatedCount = 0;

    // Update each customer if their status is lowercase
    for (const customer of customers) {
      const currentStatus = customer.loyaltyStatus;
      const normalizedStatus = statusMapping[currentStatus.toLowerCase()];

      if (normalizedStatus && currentStatus !== normalizedStatus) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { loyaltyStatus: normalizedStatus },
        });

        console.log(`✓ Updated ${customer.firstName} ${customer.lastName}: "${currentStatus}" → "${normalizedStatus}"`);
        updatedCount++;
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} customer(s)`);
    console.log(`📊 ${customers.length - updatedCount} customer(s) already had correct casing`);

  } catch (error) {
    console.error('❌ Error fixing loyalty status casing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLoyaltyStatusCasing();
