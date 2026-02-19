
import { prisma } from '../lib/prisma';

async function resetData() {
    console.log('--- STARTING DATA RESET ---');

    try {
        // 1. TransactionDetail (Depends on Transaction)
        console.log('Deleting TransactionDetail...');
        await prisma.transactionDetail.deleteMany({});

        // 2. Transaction (Depends on Store, User, Vehicle)
        console.log('Deleting Transaction...');
        await prisma.transaction.deleteMany({});

        // 3. RouteAssignment (Depends on Vehicle, User)
        console.log('Deleting RouteAssignment...');
        await prisma.routeAssignment.deleteMany({});

        // 4. UserStock (Depends on User)
        console.log('Deleting UserStock...');
        await prisma.userStock.deleteMany({});

        // 5. WarehouseStock (Standalone)
        console.log('Deleting WarehouseStock...');
        await prisma.warehouseStock.deleteMany({});

        // 6. Vehicle (Referenced by RouteAssignment, Transaction)
        console.log('Deleting Vehicle...');
        await prisma.vehicle.deleteMany({});

        console.log('--- DATA RESET COMPLETED SUCCESSFULLY ---');
        console.log('Preserved Tables: User, Store');

    } catch (error) {
        console.error('ERROR RESETTING DATA:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

resetData();
