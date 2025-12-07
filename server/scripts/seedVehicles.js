
import prisma from '../db.js';
import { faker } from '@faker-js/faker';

async function main() {
    console.log('Starting seed...');

    // 1. Create a dummy customer to own these vehicles
    const customer = await prisma.customer.create({
        data: {
            firstName: 'Fleet',
            lastName: 'Manager',
            email: `fleet.manager.${Date.now()}@example.com`,
            phoneNumber: '555-0000',
        },
    });

    console.log(`Created customer: ${customer.firstName} ${customer.lastName} (${customer.id})`);

    // 2. Generate 2500 vehicles
    const vehicles = [];
    const BATCH_SIZE = 500;
    const TOTAL_VEHICLES = 2500;

    for (let i = 0; i < TOTAL_VEHICLES; i++) {
        vehicles.push({
            customerId: customer.id,
            licensePlate: faker.vehicle.vrm().substring(0, 10).toUpperCase() + i, // Ensure uniqueness
            make: faker.vehicle.manufacturer(),
            model: faker.vehicle.model(),
            year: faker.date.past({ years: 20 }).getFullYear(),
            vin: `VIN${i.toString().padStart(14, '0')}`, // Ensure uniqueness and 17 chars max
            mileage: faker.number.int({ min: 0, max: 200000 }),
            vehicleType: faker.vehicle.type(),
            color: faker.vehicle.color(),
            dateRegistered: faker.date.past({ years: 2 }),
            notes: 'Load test vehicle',
            imageUrl: null,
            imageFileId: null
        });
    }

    // 3. Insert in batches
    console.log(`Inserting ${TOTAL_VEHICLES} vehicles...`);
    for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
        const batch = vehicles.slice(i, i + BATCH_SIZE);
        await prisma.vehicle.createMany({
            data: batch,
            skipDuplicates: true,
        });
        console.log(`Inserted batch ${i / BATCH_SIZE + 1}/${Math.ceil(TOTAL_VEHICLES / BATCH_SIZE)}`);
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
