const mockPrisma = {
    routeAssignment: {
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

describe('Assignments API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const sampleStock = { '1000': 100, '5000': 50, '10000': 20 };
    const sampleAssignment = {
        id: 'assign-1',
        vehicleId: 'B 1234 XYZ',
        date: '2026-02-11',
        cashierId: '12345',
        driverId: '67890',
        initialStock: sampleStock,
        currentStock: sampleStock,
        status: 'Active',
        storeCodes: [],
        currentStopIndex: 0,
        vehicle: { nopol: 'B 1234 XYZ', brand: 'Toyota' },
        cashier: { nik: '12345', full_name: 'Kasir A' },
        driver: { nik: '67890', full_name: 'Supir B' },
    };

    // ── GET /api/assignments ──
    describe('GET /api/assignments', () => {
        it('should return assignments with relations', async () => {
            mockPrisma.routeAssignment.findMany.mockResolvedValue([sampleAssignment]);

            const res = await request(app).get('/api/assignments');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].cashier.full_name).toBe('Kasir A');
            expect(res.body[0].driver.full_name).toBe('Supir B');
            expect(res.body[0].initialStock).toEqual(sampleStock);
        });

        it('should NOT contain suratTugasUrl in response', async () => {
            mockPrisma.routeAssignment.findMany.mockResolvedValue([sampleAssignment]);

            const res = await request(app).get('/api/assignments');

            expect(res.body[0]).not.toHaveProperty('suratTugasUrl');
        });

        it('should return 500 on DB error', async () => {
            mockPrisma.routeAssignment.findMany.mockRejectedValue(new Error('DB'));

            const res = await request(app).get('/api/assignments');

            expect(res.status).toBe(500);
        });
    });

    // ── POST /api/assignments ──
    describe('POST /api/assignments', () => {
        it('should create an assignment with initialStock and default currentStock', async () => {
            mockPrisma.routeAssignment.create.mockResolvedValue(sampleAssignment);

            const res = await request(app)
                .post('/api/assignments')
                .send({
                    date: '2026-02-11',
                    vehicleId: 'B 1234 XYZ',
                    cashierId: '12345',
                    driverId: '67890',
                    initialStock: sampleStock,
                });

            expect(res.status).toBe(200);
            expect(mockPrisma.routeAssignment.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    initialStock: sampleStock,
                    currentStock: sampleStock, // defaults to initialStock
                    status: 'Active',
                }),
                include: expect.any(Object),
            });
        });

        it('should NOT accept suratTugasUrl field', async () => {
            mockPrisma.routeAssignment.create.mockResolvedValue(sampleAssignment);

            await request(app)
                .post('/api/assignments')
                .send({
                    date: '2026-02-11',
                    vehicleId: 'B 1234 XYZ',
                    cashierId: '12345',
                    driverId: '67890',
                    initialStock: sampleStock,
                    suratTugasUrl: 'https://fake-url.com/file.pdf',
                });

            // The controller destructures only known fields, so suratTugasUrl should be ignored
            const createCall = mockPrisma.routeAssignment.create.mock.calls[0][0];
            expect(createCall.data).not.toHaveProperty('suratTugasUrl');
        });

        it('should return 500 on creation error', async () => {
            mockPrisma.routeAssignment.create.mockRejectedValue(new Error('FK constraint'));

            const res = await request(app)
                .post('/api/assignments')
                .send({ date: '2026-02-11', vehicleId: 'INVALID' });

            expect(res.status).toBe(500);
        });
    });

    // ── PUT /api/assignments/:id ──
    describe('PUT /api/assignments/:id', () => {
        it('should update an assignment', async () => {
            const updatedAssignment = { ...sampleAssignment, status: 'Completed' };
            mockPrisma.routeAssignment.update.mockResolvedValue(updatedAssignment);

            const res = await request(app)
                .put('/api/assignments/assign-1')
                .send({ status: 'Completed' });

            expect(res.status).toBe(200);
            expect(mockPrisma.routeAssignment.update).toHaveBeenCalledWith({
                where: { id: 'assign-1' },
                data: expect.any(Object),
                include: expect.any(Object),
            });
        });

        it('should NOT pass suratTugasUrl on update', async () => {
            mockPrisma.routeAssignment.update.mockResolvedValue(sampleAssignment);

            await request(app)
                .put('/api/assignments/assign-1')
                .send({ status: 'Completed', suratTugasUrl: 'https://hack.com/evil.pdf' });

            const updateCall = mockPrisma.routeAssignment.update.mock.calls[0][0];
            expect(updateCall.data).not.toHaveProperty('suratTugasUrl');
        });
    });

    // ── DELETE /api/assignments/:id ──
    describe('DELETE /api/assignments/:id', () => {
        it('should delete an assignment', async () => {
            mockPrisma.routeAssignment.delete.mockResolvedValue({});

            const res = await request(app).delete('/api/assignments/assign-1');

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('deleted');
            expect(mockPrisma.routeAssignment.delete).toHaveBeenCalledWith({ where: { id: 'assign-1' } });
        });

        it('should return 500 if assignment not found', async () => {
            mockPrisma.routeAssignment.delete.mockRejectedValue(new Error('Not found'));

            const res = await request(app).delete('/api/assignments/INVALID');

            expect(res.status).toBe(500);
        });
    });
});
