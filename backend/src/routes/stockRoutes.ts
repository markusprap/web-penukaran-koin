import { Router } from 'express';
import { getStock, updateStock } from '../controllers/stockController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getStock);
router.put('/', authMiddleware, updateStock);

export default router;
