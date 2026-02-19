import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getAssignments = async (req: Request, res: Response) => {
    try {
        const assignments = await prisma.routeAssignment.findMany({
            include: {
                vehicle: true,
                cashier: { select: { nik: true, full_name: true } },
                driver: { select: { nik: true, full_name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};

export const createAssignment = async (req: Request, res: Response) => {
    try {
        console.log('>>> CREATE ASSIGNMENT REQUEST RECEIVED');
        console.log('>>> Body:', JSON.stringify(req.body, null, 2));

        const { date, vehicleId, cashierId, driverId, initialStock, currentStock, status, storeCodes } = req.body;

        // 1. Core Validation
        if (!date || !vehicleId || !cashierId || !driverId) {
            console.error('>>> Error: Missing mandatory fields');
            return res.status(400).json({ error: 'Data mandatori (Tanggal, Armada, Kasir, Supir) harus diisi.' });
        }

        // 2. Check for duplicate assignment
        const existing = await prisma.routeAssignment.findFirst({
            where: {
                date,
                OR: [
                    { vehicleId },
                    { cashierId },
                    { driverId }
                ],
                status: { not: 'Completed' }
            }
        });

        if (existing) {
            console.warn('>>> Warning: Duplicate active assignment detected');
            return res.status(400).json({ error: 'Petugas atau armada sudah memiliki tugas aktif pada tanggal tersebut.' });
        }

        // 3. Deduct stock from warehouse
        if (initialStock && typeof initialStock === 'object') {
            console.log('>>> Deducting warehouse stock...');
            const deductions = Object.entries(initialStock).map(([denomStr, qty]) => {
                const denom = parseInt(denomStr);
                const quantity = qty as number;
                return prisma.warehouseStock.upsert({
                    where: { denom },
                    update: { qty: { decrement: quantity } },
                    create: { denom, qty: -quantity }
                });
            });
            await prisma.$transaction(deductions);
            console.log('>>> Warehouse stock deducted successfully');
        }

        // 3a. Update UserStock (Cashier receives stock)
        if (initialStock && typeof initialStock === 'object') {
            const userStockUpdates = Object.entries(initialStock).map(([denomStr, qty]) => {
                const denom = parseInt(denomStr);
                const quantity = qty as number;
                // Currently only tracking coins in UserStock based on schema (balanceCoin)
                // Assuming we sum up value for balanceCoin? Or is it a JSON store? 
                // Schema says: balanceCoin Float, balanceBigMoney Float.
                // It seems it tracks VALUE, not individual pieces per denom.
                // Let's calculate total value first.
                return { denom, quantity };
            });

            const totalCoinValue = userStockUpdates
                .filter(i => i.denom <= 1000) // Assuming <= 1000 is coin, but wait, usually < 1000 or <= 1000? 
            // Actually let's look at CoinDenom in store: 100, 200, 500, 1000. 
            // 1000 is sometimes coin sometimes paper. 
            // Let's assume standard logic: 100, 200, 500, 1000 (coin). 
            // Checks schema itemType: COIN vs BIG_MONEY. 
            // But here we just have initialStock object { "100": 10, "50000": 5 }.
            // Let's sum ALL as "balanceCoin" for now if they are small? 
            // Or better, checking the schema again: `balanceCoin` and `balanceBigMoney`.
            // Let's split based on value. < 2000 = Coin? 
            // Standard Indomaret: 100, 200, 500, 1000 are coins.
            // 1000, 2000, 5000, 10000, 20000, 50000, 100000 are Big Money.

            // WAIT. The assignment is usually for "Modal Kerja" which is mostly COINS for exchange.
            // Let's calculate total value added.

            let addedCoin = 0;
            let addedBigMoney = 0;

            Object.entries(initialStock).forEach(([d, q]) => {
                const denom = parseInt(d);
                const val = denom * (q as number);
                if (denom <= 1000) addedCoin += val;
                else addedBigMoney += val;
            });

            await prisma.userStock.upsert({
                where: { userNik: cashierId },
                update: {
                    balanceCoin: { increment: addedCoin },
                    balanceBigMoney: { increment: addedBigMoney }
                },
                create: {
                    userNik: cashierId,
                    balanceCoin: addedCoin,
                    balanceBigMoney: addedBigMoney
                }
            });
        }

        // 4. Create record with defaults
        const finalData = {
            date,
            vehicleId,
            cashierId,
            driverId,
            initialStock: initialStock || {},
            currentStock: currentStock || initialStock || {},
            status: status || 'Ready',
            storeCodes: storeCodes || [],
            currentStopIndex: 0
        };

        console.log('>>> Final Prisma Create Payload:', JSON.stringify(finalData, null, 2));

        const assignment = await prisma.routeAssignment.create({
            data: finalData,
            include: {
                vehicle: true,
                cashier: { select: { nik: true, full_name: true } },
                driver: { select: { nik: true, full_name: true } }
            }
        });

        console.log('>>> Assignment created successfully:', assignment.id);
        res.json(assignment);
    } catch (error: any) {
        console.error('>>> CRITICAL CREATE ASSIGNMENT ERROR:', error);
        res.status(500).json({
            error: 'Gagal membuat penugasan',
            details: error.message,
            stack: error.stack
        });
    }
};

export const updateAssignment = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const { date, vehicleId, cashierId, driverId, initialStock, currentStock, status, currentStopIndex } = req.body;
        const assignment = await prisma.routeAssignment.update({
            where: { id },
            data: {
                date,
                vehicleId,
                cashierId,
                driverId,
                initialStock,
                currentStock,
                status,
                currentStopIndex
            },
            include: {
                vehicle: true,
                cashier: { select: { nik: true, full_name: true } },
                driver: { select: { nik: true, full_name: true } }
            }
        });
        res.json(assignment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update assignment' });
    }
};

export const completeAssignment = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const { remainingStock } = req.body;

        // Return remaining stock to warehouse
        if (remainingStock && typeof remainingStock === 'object') {
            const returns = Object.entries(remainingStock)
                .filter(([, qty]) => (qty as number) > 0)
                .map(([denomStr, qty]) => {
                    const denom = parseInt(denomStr);
                    const quantity = qty as number;
                    return prisma.warehouseStock.upsert({
                        where: { denom },
                        update: { qty: { increment: quantity } },
                        create: { denom, qty: quantity }
                    });
                });
            await prisma.$transaction(returns);
        }

        // 3a. Update UserStock (Deduct from Cashier as they return stock to warehouse)
        const existingAssignment = await prisma.routeAssignment.findUnique({ where: { id } });
        if (existingAssignment && remainingStock && typeof remainingStock === 'object') {
            let returnedCoin = 0;
            let returnedBigMoney = 0;

            Object.entries(remainingStock).forEach(([d, q]) => {
                const denom = parseInt(d);
                const val = denom * (q as number);
                if (denom <= 1000) returnedCoin += val;
                else returnedBigMoney += val;
            });

            await prisma.userStock.upsert({
                where: { userNik: existingAssignment.cashierId },
                update: {
                    balanceCoin: { decrement: returnedCoin },
                    balanceBigMoney: { decrement: returnedBigMoney }
                },
                create: {
                    userNik: existingAssignment.cashierId,
                    balanceCoin: -returnedCoin,
                    balanceBigMoney: -returnedBigMoney
                }
            });
        }

        const updatedAssignment = await prisma.routeAssignment.update({
            where: { id },
            data: {
                status: 'Completed',
                currentStock: remainingStock || {},
            },
            include: {
                vehicle: true,
                cashier: { select: { nik: true, full_name: true } },
                driver: { select: { nik: true, full_name: true } }
            }
        });

        res.json({
            message: 'Assignment completed successfully',
            assignment: updatedAssignment,
            returnedStock: remainingStock
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to complete assignment' });
    }
};

export const deleteAssignment = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        // Get the assignment first to check if we need to return stock
        const assignment = await prisma.routeAssignment.findUnique({
            where: { id }
        });

        if (assignment && assignment.status === 'Active') {
            // Return initialStock to warehouse since assignment is being cancelled
            const stock = assignment.initialStock as Record<string, number>;
            if (stock && typeof stock === 'object') {
                const returns = Object.entries(stock)
                    .filter(([, qty]) => (qty as number) > 0)
                    .map(([denomStr, qty]) => {
                        const denom = parseInt(denomStr);
                        const quantity = qty as number;
                        return prisma.warehouseStock.upsert({
                            where: { denom },
                            update: { qty: { increment: quantity } },
                            create: { denom, qty: quantity }
                        });
                    });
                await prisma.$transaction(returns);
            }
        }

        await prisma.routeAssignment.delete({
            where: { id }
        });
        res.json({ message: 'Assignment deleted successfully, stock returned to warehouse' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
};
