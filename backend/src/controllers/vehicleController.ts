import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getVehicles = async (req: Request, res: Response) => {
    try {
        const vehicles = await prisma.vehicle.findMany();
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
};

export const createVehicle = async (req: Request, res: Response) => {
    try {
        const vehicle = await prisma.vehicle.create({
            data: req.body
        });
        res.json(vehicle);
    } catch (error) {
        console.error('Create Vehicle Error:', error);
        res.status(500).json({ error: 'Failed to create vehicle' });
    }
};

export const updateVehicle = async (req: Request, res: Response) => {
    const idOrNopol = req.params.nopol as string;
    console.log('Update Vehicle Params:', { idOrNopol, body: req.body });
    try {
        const vehicle = await prisma.vehicle.update({
            where: { id: idOrNopol },
            data: req.body
        });
        res.json(vehicle);
    } catch (error) {
        console.error('Update Vehicle Error:', error);
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
};

export const deleteVehicle = async (req: Request, res: Response) => {
    const idOrNopol = req.params.nopol as string;
    console.log('Delete Vehicle Params:', { idOrNopol });
    try {
        await prisma.vehicle.delete({
            where: { id: idOrNopol }
        });
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Delete Vehicle Error:', error);
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
};
