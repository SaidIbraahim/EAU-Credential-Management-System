import { Router } from 'express';
import { UltraStudentController } from '../controllers/student.controller.ultra';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const studentController = new UltraStudentController();

// All routes require authentication
router.use(authenticate);

/**
 * ULTRA-OPTIMIZED STUDENT ROUTES
 * Target: <200ms for student list operations
 */

// Ultra-fast paginated student list
router.get('/', studentController.getStudents.bind(studentController));

// Lightning-fast student search (for autocomplete)
router.get('/search', studentController.searchStudents.bind(studentController));

// Ultra-fast dashboard statistics
router.get('/stats', studentController.getStudentStats.bind(studentController));

// Ultra-fast single student details
router.get('/:id', studentController.getStudent.bind(studentController));

// Cache management (admin only)
router.delete('/cache/clear', studentController.clearCache.bind(studentController));
router.get('/cache/stats', studentController.getCacheStats.bind(studentController));

export default router; 