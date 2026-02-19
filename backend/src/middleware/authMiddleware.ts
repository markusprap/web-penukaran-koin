import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity_secret_key_2026';

export interface AuthRequest extends Request {
    user?: {
        nik: string;
        role: string;
        position: string;
    };
}

/**
 * Middleware: Validates JWT token from Authorization header.
 * Blocks all requests without a valid token.
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { nik: string; role: string; position: string };
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
    }
};

/**
 * Middleware: Restricts access to specific roles.
 * Use after authMiddleware.
 */
export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Anda tidak memiliki akses ke resource ini.' });
        }
        next();
    };
};
