import { Router } from 'express';
import { resetSystemData } from '../controllers/systemController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';

const router = Router();

// POST /api/system/reset-data — SUPER_ADMIN only
router.post('/reset-data', authMiddleware, requireRole('SUPER_ADMIN'), resetSystemData);

export default router;
