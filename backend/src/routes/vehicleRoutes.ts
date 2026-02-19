import { Router } from 'express';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getVehicles);
router.post('/', authMiddleware, createVehicle);
router.put('/:nopol', authMiddleware, updateVehicle);
router.delete('/:nopol', authMiddleware, deleteVehicle);

export default router;
