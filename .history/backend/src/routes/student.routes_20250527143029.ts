import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all students (paginated)
router.get('/', StudentController.getAll);

// Get a specific student
router.get('/:id', StudentController.getById);

// Create a new student (admin only)
router.post('/', authorize(['ADMIN', 'SUPER_ADMIN']), StudentController.create);

// Bulk create students (admin only)
router.post('/bulk', authorize(['ADMIN', 'SUPER_ADMIN']), StudentController.bulkCreate);

// Update a student (admin only)
router.put('/:id', authorize(['ADMIN', 'SUPER_ADMIN']), StudentController.update);

// Delete a student (super admin only)
router.delete('/:id', authorize(['SUPER_ADMIN']), StudentController.delete);

export default router; 