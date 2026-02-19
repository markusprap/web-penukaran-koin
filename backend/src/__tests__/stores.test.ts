const mockPrisma = {
    store: {
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

describe('Stores API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── GET /api/stores ──
    describe('GET /api/stores', () => {
        it('should return a list of stores', async () => {
            const mockStores = [
                { code: 'STR001', name: 'Toko A', address: 'Jl. Raya 1', branch: 'Jombang 1', as: 'AS 1', am: 'AM 1' },
                { code: 'STR002', name: 'Toko B', address: 'Jl. Raya 2', branch: 'Jombang 2', as: 'AS 2', am: 'AM 2' },
            ];
            mockPrisma.store.findMany.mockResolvedValue(mockStores);

            const res = await request(app).get('/api/stores');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].code).toBe('STR001');
        });

        it('should return 500 on DB error', async () => {
            mockPrisma.store.findMany.mockRejectedValue(new Error('DB Error'));

            const res = await request(app).get('/api/stores');

            expect(res.status).toBe(500);
            expect(res.body.error).toBeDefined();
        });
    });

    // ── POST /api/stores ──
    describe('POST /api/stores', () => {
        it('should create a store', async () => {
            const newStore = { code: 'STR003', name: 'Toko C', address: 'Jl. Baru', branch: 'Surabaya', as: 'AS 3', am: 'AM 3' };
            mockPrisma.store.create.mockResolvedValue(newStore);

            const res = await request(app)
                .post('/api/stores')
                .send(newStore);

            expect(res.status).toBe(200);
            expect(res.body.code).toBe('STR003');
            expect(mockPrisma.store.create).toHaveBeenCalledWith({ data: expect.objectContaining({ code: 'STR003' }) });
        });

        it('should return 500 on duplicate code', async () => {
            mockPrisma.store.create.mockRejectedValue(new Error('Unique constraint'));

            const res = await request(app)
                .post('/api/stores')
                .send({ code: 'STR001', name: 'Duplicate' });

            expect(res.status).toBe(500);
        });
    });

    // ── PUT /api/stores/:code ──
    describe('PUT /api/stores/:code', () => {
        it('should update a store', async () => {
            const updatedStore = { code: 'STR001', name: 'Updated Toko A', address: 'Jl. Updated', branch: 'Jakarta', as: 'AS 1', am: 'AM 1' };
            mockPrisma.store.update.mockResolvedValue(updatedStore);

            const res = await request(app)
                .put('/api/stores/STR001')
                .send({ name: 'Updated Toko A', address: 'Jl. Updated' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Updated Toko A');
            expect(mockPrisma.store.update).toHaveBeenCalledWith({
                where: { code: 'STR001' },
                data: expect.objectContaining({ name: 'Updated Toko A' }),
            });
        });
    });

    // ── DELETE /api/stores/:code ──
    describe('DELETE /api/stores/:code', () => {
        it('should delete a store', async () => {
            mockPrisma.store.delete.mockResolvedValue({});

            const res = await request(app).delete('/api/stores/STR001');

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('deleted');
            expect(mockPrisma.store.delete).toHaveBeenCalledWith({ where: { code: 'STR001' } });
        });

        it('should return 500 if store not found', async () => {
            mockPrisma.store.delete.mockRejectedValue(new Error('Not found'));

            const res = await request(app).delete('/api/stores/INVALID');

            expect(res.status).toBe(500);
        });
    });
});
