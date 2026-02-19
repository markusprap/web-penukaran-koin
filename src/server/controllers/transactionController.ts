import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createTransaction = async (req: Request, res: Response) => {
    try {
        const {
            userNik,
            storeCode,
            vehicleNopol,
            totalCoin,
            totalBigMoney,
            storeTeamName,
            storeTeamWa,
            storeTeamPosition,
            source,
            details // Array of { denom, qty, type: 'COIN' | 'BIG_MONEY' }
        } = req.body;

        console.log('>>> [CREATE TRANSACTION] Incoming Request:', {
            source,
            userNik,
            storeCode,
            detailsCount: details?.length
        });
        console.log('>>> [CREATE TRANSACTION] Full Body:', JSON.stringify(req.body, null, 2));

        const transaction = await prisma.transaction.create({
            data: {
                userNik,
                storeCode,
                vehicleNopol: vehicleNopol || null,
                totalCoin,
                totalBigMoney,
                storeTeamName,
                storeTeamWa,
                storeTeamPosition,
                source: source || 'field',
                status: 'completed',
                ...(details && details.length > 0 ? {
                    details: {
                        create: details.map((d: { denom: number; qty: number; type: string }) => ({
                            denom: d.denom,
                            qty: d.qty,
                            type: d.type
                        }))
                    }
                } : {})
            },
            include: {
                details: true,
                store: true
            }
        });

        // If walk-in transaction, deduct coin stock AND add big money stock to warehouse
        if (source === 'walk_in' && details && details.length > 0) {
            const stockUpdates: any[] = [];

            // Deduct coins from warehouse (going out to store)
            details
                .filter((d: { type: string; qty: number }) => d.type === 'COIN' && d.qty > 0)
                .forEach((d: { denom: number; qty: number }) => {
                    stockUpdates.push(
                        prisma.warehouseStock.upsert({
                            where: { denom: d.denom },
                            update: { qty: { decrement: d.qty } },
                            create: { denom: d.denom, qty: -d.qty }
                        })
                    );
                });

            // Add big money to warehouse (received from store)
            details
                .filter((d: { type: string; qty: number }) => d.type === 'BIG_MONEY' && d.qty > 0)
                .forEach((d: { denom: number; qty: number }) => {
                    stockUpdates.push(
                        prisma.warehouseStock.upsert({
                            where: { denom: d.denom },
                            update: { qty: { increment: d.qty } },
                            create: { denom: d.denom, qty: d.qty }
                        })
                    );
                });

            if (stockUpdates.length > 0) {
                await prisma.$transaction(stockUpdates);
            }
        }

        // If field transaction, update UserStock and Assignment CurrentStock
        if (source === 'field' && details && details.length > 0) {
            // 1. Fetch Active Assignment to validate per-denom stock
            const activeAssignment = await prisma.routeAssignment.findFirst({
                where: {
                    cashierId: userNik,
                    status: 'Active'
                }
            });

            if (!activeAssignment) {
                return res.status(400).json({ error: 'Tidak ditemukan penugasan aktif untuk petugas ini.' });
            }

            const currentStock = activeAssignment.currentStock as Record<string, number>;
            const updatedStock = { ...currentStock };

            // 2. Validate each denomination
            for (const d of details) {
                if (d.type === 'COIN' && d.qty > 0) {
                    const denomKey = d.denom.toString();
                    const availableQty = updatedStock[denomKey] || 0;

                    if (availableQty < d.qty) {
                        return res.status(400).json({
                            error: `Stok pecahan [${d.denom}] tidak mencukupi atau tidak tersedia di modal petugas.`,
                            available: availableQty,
                            requested: d.qty
                        });
                    }
                    // Decrement the specific denom
                    updatedStock[denomKey] = availableQty - d.qty;
                }
            }

            // 3. Perform updates in a transaction
            let usedCoinValue = 0;
            let receivedBigMoneyValue = 0;

            details.forEach((d: { denom: number; qty: number; type: string }) => {
                const val = d.denom * d.qty;
                if (d.type === 'COIN') usedCoinValue += val;
                if (d.type === 'BIG_MONEY') receivedBigMoneyValue += val;
            });

            await prisma.$transaction([
                // Update Assignment currentStock (Per-Denom)
                prisma.routeAssignment.update({
                    where: { id: activeAssignment.id },
                    data: { currentStock: updatedStock }
                }),
                // Update UserStock (Totals for Dashboard)
                prisma.userStock.upsert({
                    where: { userNik },
                    update: {
                        balanceCoin: { decrement: usedCoinValue },
                        balanceBigMoney: { increment: receivedBigMoneyValue }
                    },
                    create: {
                        userNik,
                        balanceCoin: -usedCoinValue,
                        balanceBigMoney: receivedBigMoneyValue
                    }
                })
            ]);
        }

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
};

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { source, userNik } = req.query;

        const where: any = {};
        if (source) where.source = source as string;
        if (userNik) where.userNik = userNik as string;

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                store: true,
                details: true,
                user: { select: { nik: true, full_name: true } }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};
