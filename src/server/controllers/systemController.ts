
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const resetSystemData = async (req: Request, res: Response) => {
    try {
        console.log('--- STARTING SYSTEM DATA RESET (REQUESTED BY SUPER ADMIN) ---');

        // Execute deletions in order to respect constraints
        await prisma.$transaction([
            prisma.transactionDetail.deleteMany({}),
            prisma.transaction.deleteMany({}),
            prisma.routeAssignment.deleteMany({}),
            prisma.userStock.deleteMany({}),
            prisma.warehouseStock.deleteMany({}),
            prisma.vehicle.deleteMany({})
        ]);

        console.log('--- SYSTEM DATA RESET COMPLETED SUCCESSFULLY ---');

        // Re-initialize warehouse stock with zeros (optional but good for consistency)
        // This mirrors the initial seed logic for warehouse stock
        /* 
        await prisma.warehouseStock.create({
            data: {
                totalValue: 0,
                details: { create: [] } // Simplify for now, let it be empty until stock input
            }
        }); 
        */

        res.status(200).json({ message: 'System data reset successfully.' });
    } catch (error: any) {
        console.error('ERROR RESETTING SYSTEM DATA:', error);
        res.status(500).json({ error: 'Failed to reset system data.', details: error.message });
    }
};
