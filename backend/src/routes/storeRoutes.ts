import { Router } from 'express';
import { getStores, createStore, updateStore, deleteStore } from '../controllers/storeController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getStores);
router.post('/', authMiddleware, createStore);
router.put('/:code', authMiddleware, updateStore);
router.delete('/:code', authMiddleware, deleteStore);

export default router;
