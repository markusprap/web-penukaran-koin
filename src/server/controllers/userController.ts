import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity_secret_key_2026';
const SALT_ROUNDS = 10;

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                nik: true,
                full_name: true,
                role: true,
                position: true,
                createdAt: true,
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const { nik, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { nik }
        });

        if (!user) {
            return res.status(401).json({ error: 'NIK atau Password salah' });
        }

        // Smart password check: supports both hashed (bcrypt) and plain-text (legacy migration)
        let isMatch = false;
        const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');

        if (isHashed) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            // Legacy plain-text fallback — auto-migrate on successful match
            isMatch = user.password === password;
            if (isMatch) {
                const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
                await prisma.user.update({
                    where: { nik },
                    data: { password: hashedPassword }
                });
                console.log(`[AUTH] Auto-migrated password for NIK: ${nik}`);
            }
        }

        if (!isMatch) {
            return res.status(401).json({ error: 'NIK atau Password salah' });
        }

        const token = jwt.sign(
            { nik: user.nik, role: user.role, position: user.position },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.json({ ...userWithoutPassword, token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

export const createInitialUser = async (req: Request, res: Response) => {
    try {
        const hashedPassword = await bcrypt.hash('superadmin', SALT_ROUNDS);
        const superAdmin = await prisma.user.upsert({
            where: { nik: '99999' },
            update: { password: hashedPassword },
            create: {
                nik: '99999',
                password: hashedPassword,
                full_name: 'Super Administrator',
                role: 'SUPER_ADMIN',
                position: 'ADMIN'
            }
        });
        const { password: _, ...safe } = superAdmin;
        res.json({ message: 'Initial user created & secured', user: safe });
    } catch (error) {
        console.error('Setup User Error:', error);
        res.status(500).json({ error: 'Failed to create initial user' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { role, position, password, ...rest } = req.body;
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                ...rest,
                password: hashedPassword,
                role: (role as string).toUpperCase(),
                position: (position as string).toUpperCase()
            }
        });
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Create User Error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const nik = req.params.nik as string;
    try {
        const { role, position, password, ...rest } = req.body;
        const data: any = { ...rest };

        if (role) data.role = (role as string).toUpperCase();
        if (position) data.position = (position as string).toUpperCase();
        if (password) data.password = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await prisma.user.update({
            where: { nik },
            data: data
        });
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const nik = req.params.nik as string;
    try {
        await prisma.user.delete({
            where: { nik }
        });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
