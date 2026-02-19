// Shared mock for Prisma client
const mockPrisma = {
    user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        upsert: jest.fn(),
    },
    store: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    vehicle: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    routeAssignment: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
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

describe('Users API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── GET /api/users ──
    describe('GET /api/users', () => {
        it('should return a list of users', async () => {
            const mockUsers = [
                { nik: '12345', full_name: 'John Doe', role: 'ADMIN', position: 'ADMIN', createdAt: new Date() },
                { nik: '67890', full_name: 'Jane Smith', role: 'FIELD', position: 'CASHIER', createdAt: new Date() },
            ];
            mockPrisma.user.findMany.mockResolvedValue(mockUsers);

            const res = await request(app).get('/api/users');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].nik).toBe('12345');
            expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1);
        });

        it('should return 500 on DB error', async () => {
            mockPrisma.user.findMany.mockRejectedValue(new Error('DB Error'));

            const res = await request(app).get('/api/users');

            expect(res.status).toBe(500);
            expect(res.body.error).toBeDefined();
        });
    });

    // ── POST /api/users/login ──
    describe('POST /api/users/login', () => {
        it('should login with valid credentials', async () => {
            const mockUser = { nik: '12345', password: 'pass123', full_name: 'John Doe', role: 'ADMIN', position: 'ADMIN' };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/users/login')
                .send({ nik: '12345', password: 'pass123' });

            expect(res.status).toBe(200);
            expect(res.body.nik).toBe('12345');
            expect(res.body.full_name).toBe('John Doe');
            expect(res.body.password).toBeUndefined(); // password should be stripped
        });

        it('should reject invalid credentials (user not found)', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/users/login')
                .send({ nik: '99999', password: 'wrong' });

            expect(res.status).toBe(401);
            expect(res.body.error).toContain('salah');
        });

        it('should reject wrong password', async () => {
            const mockUser = { nik: '12345', password: 'correct', full_name: 'John Doe' };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/users/login')
                .send({ nik: '12345', password: 'wrong' });

            expect(res.status).toBe(401);
        });
    });

    // ── POST /api/users ──
    describe('POST /api/users', () => {
        it('should create a user with uppercase role and position', async () => {
            const inputUser = { nik: '11111', password: 'test', full_name: 'Test User', role: 'field', position: 'driver' };
            const createdUser = { ...inputUser, role: 'FIELD', position: 'DRIVER', id: 'uuid-1' };
            mockPrisma.user.create.mockResolvedValue(createdUser);

            const res = await request(app)
                .post('/api/users')
                .send(inputUser);

            expect(res.status).toBe(200);
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    role: 'FIELD',
                    position: 'DRIVER',
                }),
            });
        });

        it('should return 500 on creation error', async () => {
            mockPrisma.user.create.mockRejectedValue(new Error('Duplicate'));

            const res = await request(app)
                .post('/api/users')
                .send({ nik: '11111', password: 'test', full_name: 'Test', role: 'FIELD', position: 'DRIVER' });

            expect(res.status).toBe(500);
        });
    });

    // ── PUT /api/users/:nik ──
    describe('PUT /api/users/:nik', () => {
        it('should update a user', async () => {
            const updatedUser = { nik: '12345', full_name: 'Updated Name', role: 'ADMIN', position: 'ADMIN' };
            mockPrisma.user.update.mockResolvedValue(updatedUser);

            const res = await request(app)
                .put('/api/users/12345')
                .send({ full_name: 'Updated Name', role: 'admin', position: 'admin' });

            expect(res.status).toBe(200);
            expect(res.body.full_name).toBe('Updated Name');
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { nik: '12345' },
                data: expect.objectContaining({ full_name: 'Updated Name', role: 'ADMIN', position: 'ADMIN' }),
            });
        });
    });

    // ── DELETE /api/users/:nik ──
    describe('DELETE /api/users/:nik', () => {
        it('should delete a user', async () => {
            mockPrisma.user.delete.mockResolvedValue({});

            const res = await request(app).delete('/api/users/12345');

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('deleted');
            expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { nik: '12345' } });
        });

        it('should return 500 if user not found', async () => {
            mockPrisma.user.delete.mockRejectedValue(new Error('Not found'));

            const res = await request(app).delete('/api/users/XXXXX');

            expect(res.status).toBe(500);
        });
    });

    // ── POST /api/users/setup ──
    describe('POST /api/users/setup', () => {
        it('should create or upsert the initial super admin', async () => {
            const superAdmin = { nik: '99999', full_name: 'Super Administrator', role: 'SUPER_ADMIN', position: 'ADMIN' };
            mockPrisma.user.upsert.mockResolvedValue(superAdmin);

            const res = await request(app).post('/api/users/setup');

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('Initial user');
            expect(mockPrisma.user.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { nik: '99999' },
                    create: expect.objectContaining({ role: 'SUPER_ADMIN' }),
                })
            );
        });
    });
});
