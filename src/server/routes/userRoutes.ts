import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, loginUser, createInitialUser } from '../controllers/userController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Public routes (no token needed)
router.post('/login', loginUser);
router.post('/setup', createInitialUser);

// Protected routes
router.get('/', authMiddleware, getUsers);
router.post('/', authMiddleware, requireRole('SUPER_ADMIN'), createUser);
router.put('/:nik', authMiddleware, requireRole('SUPER_ADMIN', 'ADMIN'), updateUser);
router.delete('/:nik', authMiddleware, requireRole('SUPER_ADMIN'), deleteUser);

export default router;
