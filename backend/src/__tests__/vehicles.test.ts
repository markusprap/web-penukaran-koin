const mockPrisma = {
    vehicle: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
};

jest.mock('../lib/prisma', () => ({
    prisma: mockPrisma,
}));

import request from 'supertest';
import { app } from '../index';

describe('Vehicles API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── GET /api/vehicles ──
    describe('GET /api/vehicles', () => {
        it('should return a list of vehicles', async () => {
            const mockVehicles = [
                { id: 'v1', nopol: 'B 1234 XYZ', brand: 'Toyota', type: 'Avanza', description: 'Silver Avanza' },
                { id: 'v2', nopol: 'B 5678 ABC', brand: 'Daihatsu', type: 'Gran Max', description: 'White Gran Max' },
            ];
            mockPrisma.vehicle.findMany.mockResolvedValue(mockVehicles);

            const res = await request(app).get('/api/vehicles');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].nopol).toBe('B 1234 XYZ');
        });

        it('should return 500 on DB error', async () => {
            mockPrisma.vehicle.findMany.mockRejectedValue(new Error('DB Error'));

            const res = await request(app).get('/api/vehicles');

            expect(res.status).toBe(500);
            expect(res.body.error).toBeDefined();
        });
    });

    // ── POST /api/vehicles ──
    describe('POST /api/vehicles', () => {
        it('should create a vehicle', async () => {
            const newVehicle = { nopol: 'B 9999 ZZZ', brand: 'Honda', type: 'Brio', description: 'Red Brio' };
            mockPrisma.vehicle.create.mockResolvedValue({ id: 'v3', ...newVehicle });

            const res = await request(app)
                .post('/api/vehicles')
                .send(newVehicle);

            expect(res.status).toBe(200);
            expect(res.body.nopol).toBe('B 9999 ZZZ');
            expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({ data: expect.objectContaining({ nopol: 'B 9999 ZZZ' }) });
        });

        it('should return 500 on creation error', async () => {
            mockPrisma.vehicle.create.mockRejectedValue(new Error('Duplicate'));

            const res = await request(app)
                .post('/api/vehicles')
                .send({ nopol: 'B 1234 XYZ' });

            expect(res.status).toBe(500);
        });
    });

    // ── PUT /api/vehicles/:nopol ──
    describe('PUT /api/vehicles/:nopol', () => {
        it('should update a vehicle by id', async () => {
            const updatedVehicle = { id: 'v1', nopol: 'B 1234 XYZ', brand: 'Toyota', type: 'Avanza', description: 'Updated Silver' };
            mockPrisma.vehicle.update.mockResolvedValue(updatedVehicle);

            const res = await request(app)
                .put('/api/vehicles/v1')
                .send({ description: 'Updated Silver' });

            expect(res.status).toBe(200);
            expect(res.body.description).toBe('Updated Silver');
            expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
                where: { id: 'v1' },
                data: expect.objectContaining({ description: 'Updated Silver' }),
            });
        });
    });

    // ── DELETE /api/vehicles/:nopol ──
    describe('DELETE /api/vehicles/:nopol', () => {
        it('should delete a vehicle by id', async () => {
            mockPrisma.vehicle.delete.mockResolvedValue({});

            const res = await request(app).delete('/api/vehicles/v1');

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('deleted');
            expect(mockPrisma.vehicle.delete).toHaveBeenCalledWith({ where: { id: 'v1' } });
        });

        it('should return 500 if vehicle not found', async () => {
            mockPrisma.vehicle.delete.mockRejectedValue(new Error('Not found'));

            const res = await request(app).delete('/api/vehicles/INVALID');

            expect(res.status).toBe(500);
        });
    });
});
