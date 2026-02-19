import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getStores = async (req: Request, res: Response) => {
    try {
        const stores = await prisma.store.findMany();
        res.json(stores);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
};

export const createStore = async (req: Request, res: Response) => {
    try {
        console.log('Creating store with data:', req.body);
        const store = await prisma.store.create({
            data: req.body
        });
        res.json(store);
    } catch (error: any) {
        console.error('Failed to create store:', error);
        res.status(500).json({ error: error.message || 'Failed to create store' });
    }
};

export const updateStore = async (req: Request, res: Response) => {
    const code = req.params.code as string;
    try {
        const store = await prisma.store.update({
            where: { code },
            data: req.body
        });
        res.json(store);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update store' });
    }
};

export const deleteStore = async (req: Request, res: Response) => {
    const code = req.params.code as string;
    try {
        await prisma.store.delete({
            where: { code }
        });
        res.json({ message: 'Store deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete store' });
    }
};
