import { Router } from 'express';
import { getAssignments, createAssignment, updateAssignment, completeAssignment, deleteAssignment } from '../controllers/assignmentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getAssignments);
router.post('/', authMiddleware, createAssignment);
router.put('/:id', authMiddleware, updateAssignment);
router.post('/:id/complete', authMiddleware, completeAssignment);
router.delete('/:id', authMiddleware, deleteAssignment);

export default router;
