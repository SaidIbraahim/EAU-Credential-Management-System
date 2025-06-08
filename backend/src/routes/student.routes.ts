import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all students (paginated)
router.get('/', StudentController.getAll);

// Get all students for validation (no pagination - only essential fields)
router.get('/validation', StudentController.getAllForValidation);

// Get student by ID
router.get('/:id', StudentController.getById);

// Create new student (admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), StudentController.create);

// Update student (admin only)
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), StudentController.update);

// Delete student (admin only)
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), StudentController.delete);

// Bulk create students (admin only)
router.post('/bulk', authorize('ADMIN', 'SUPER_ADMIN'), StudentController.bulkCreate);

export default router; 