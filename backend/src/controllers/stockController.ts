import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// GET /api/stock — returns warehouse stock as { [denom]: qty }
export const getStock = async (req: Request, res: Response) => {
    try {
        const stocks = await prisma.warehouseStock.findMany({
            orderBy: { denom: 'asc' }
        });

        // Convert array to { denom: qty } object
        const stockMap: Record<number, number> = {};
        stocks.forEach(s => {
            stockMap[s.denom] = s.qty;
        });

        // Ensure all standard denoms are present
        const defaultDenoms = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
        defaultDenoms.forEach(d => {
            if (!(d in stockMap)) stockMap[d] = 0;
        });

        res.json(stockMap);
    } catch (error) {
        console.error('Get stock error:', error);
        res.status(500).json({ error: 'Failed to fetch stock' });
    }
};

// PUT /api/stock — bulk upsert stock from { [denom]: qty }
export const updateStock = async (req: Request, res: Response) => {
    console.log('>>> UPDATE STOCK REQUEST RECEIVED');
    console.log('>>> Body:', JSON.stringify(req.body, null, 2));
    try {
        const stockData: Record<string, number> = req.body;

        if (!stockData || typeof stockData !== 'object') {
            console.error('>>> Error: Invalid stock data format');
            return res.status(400).json({ error: 'Invalid stock data format' });
        }

        const upserts = Object.entries(stockData).map(([denomStr, qty]) => {
            const denom = parseInt(denomStr);
            const quantity = typeof qty === 'string' ? parseFloat(qty) : qty;

            console.log(`>>> Preparing upsert for denom ${denom} with qty ${quantity}`);

            return prisma.warehouseStock.upsert({
                where: { denom },
                update: { qty: quantity },
                create: { denom, qty: quantity }
            });
        });

        console.log(`>>> Executing transaction with ${upserts.length} operations`);
        await prisma.$transaction(upserts);
        console.log('>>> Transaction successful');

        // Return updated stock
        const stocks = await prisma.warehouseStock.findMany({ orderBy: { denom: 'asc' } });
        const stockMap: Record<number, number> = {};
        stocks.forEach(s => { stockMap[s.denom] = s.qty; });

        console.log('>>> Returning updated stock map');
        res.json(stockMap);
    } catch (error: any) {
        console.error('>>> CRITICAL UPDATE STOCK ERROR:', error);
        res.status(500).json({
            error: 'Failed to update stock',
            details: error.message,
            stack: error.stack
        });
    }
};
