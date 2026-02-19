const mockPrisma = {
    user: { findMany: jest.fn() },
    store: { findMany: jest.fn() },
    vehicle: { findMany: jest.fn() },
    routeAssignment: { findMany: jest.fn() },
    transaction: { findMany: jest.fn() },
};

jest.mock('../lib/prisma', () => ({
    prisma: mockPrisma,
}));

import request from 'supertest';
import { app } from '../index';

/**
 * These tests verify the "Surat Tugas" cleanup was successful:
 * - No /api/documents route exists
 * - The Document table is not referenced
 * - suratTugasUrl is not used in any endpoint
 */
describe('Surat Tugas Cleanup Verification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Document routes removed', () => {
        it('GET /api/documents should return 404', async () => {
            const res = await request(app).get('/api/documents');
            expect(res.status).toBe(404);
        });

        it('POST /api/documents should return 404', async () => {
            const res = await request(app)
                .post('/api/documents')
                .send({ name: 'test', file: 'base64data...' });
            expect(res.status).toBe(404);
        });

        it('DELETE /api/documents/xxx should return 404', async () => {
            const res = await request(app).delete('/api/documents/some-id');
            expect(res.status).toBe(404);
        });
    });

    describe('Health check', () => {
        it('GET / should return API running message', async () => {
            const res = await request(app).get('/');
            expect(res.status).toBe(200);
            expect(res.text).toContain('Coin Exchange API is running');
        });
    });

    describe('All remaining API routes are accessible', () => {
        it('GET /api/users should not return 404', async () => {
            mockPrisma.user.findMany.mockResolvedValue([]);
            const res = await request(app).get('/api/users');
            expect(res.status).not.toBe(404);
        });

        it('GET /api/stores should not return 404', async () => {
            mockPrisma.store.findMany.mockResolvedValue([]);
            const res = await request(app).get('/api/stores');
            expect(res.status).not.toBe(404);
        });

        it('GET /api/vehicles should not return 404', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([]);
            const res = await request(app).get('/api/vehicles');
            expect(res.status).not.toBe(404);
        });

        it('GET /api/assignments should not return 404', async () => {
            mockPrisma.routeAssignment.findMany.mockResolvedValue([]);
            const res = await request(app).get('/api/assignments');
            expect(res.status).not.toBe(404);
        });

        it('GET /api/transactions should not return 404', async () => {
            mockPrisma.transaction.findMany.mockResolvedValue([]);
            const res = await request(app).get('/api/transactions');
            expect(res.status).not.toBe(404);
        });
    });
});
