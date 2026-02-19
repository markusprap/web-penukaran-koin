const mockPrisma = {
    transaction: {
        findMany: jest.fn(),
        create: jest.fn(),
    },
};

jest.mock('../lib/prisma', () => ({
    prisma: mockPrisma,
}));

import request from 'supertest';
import { app } from '../index';

describe('Transactions API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const sampleTransaction = {
        id: 'tx-1',
        userNik: '12345',
        storeCode: 'STR001',
        vehicleNopol: 'B 1234 XYZ',
        totalCoin: 50000,
        totalBigMoney: 50000,
        storeTeamName: 'Budi',
        storeTeamWa: '08123456789',
        storeTeamPosition: 'Kepala Toko',
        status: 'completed',
        createdAt: new Date().toISOString(),
        store: { code: 'STR001', name: 'Toko A' },
    };

    // ── GET /api/transactions ──
    describe('GET /api/transactions', () => {
        it('should return transactions with store relation', async () => {
            mockPrisma.transaction.findMany.mockResolvedValue([sampleTransaction]);

            const res = await request(app).get('/api/transactions');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].storeCode).toBe('STR001');
            expect(res.body[0].store.name).toBe('Toko A');
        });

        it('should return 500 on DB error', async () => {
            mockPrisma.transaction.findMany.mockRejectedValue(new Error('DB Error'));

            const res = await request(app).get('/api/transactions');

            expect(res.status).toBe(500);
            expect(res.body.error).toBeDefined();
        });
    });

    // ── POST /api/transactions ──
    describe('POST /api/transactions', () => {
        it('should create a transaction with status completed', async () => {
            mockPrisma.transaction.create.mockResolvedValue(sampleTransaction);

            const res = await request(app)
                .post('/api/transactions')
                .send({
                    userNik: '12345',
                    storeCode: 'STR001',
                    vehicleNopol: 'B 1234 XYZ',
                    totalCoin: 50000,
                    totalBigMoney: 50000,
                    storeTeamName: 'Budi',
                    storeTeamWa: '08123456789',
                    storeTeamPosition: 'Kepala Toko',
                });

            expect(res.status).toBe(201);
            expect(res.body.totalCoin).toBe(50000);
            expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userNik: '12345',
                    storeCode: 'STR001',
                    status: 'completed',
                }),
            });
        });

        it('should return 500 on creation error', async () => {
            mockPrisma.transaction.create.mockRejectedValue(new Error('FK constraint'));

            const res = await request(app)
                .post('/api/transactions')
                .send({ userNik: 'INVALID' });

            expect(res.status).toBe(500);
        });
    });
});
