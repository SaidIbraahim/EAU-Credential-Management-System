import { Router } from 'express';
import { CachedStudentController } from '../controllers/student.controller.cached';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const cachedStudentController = new CachedStudentController();

// All routes require authentication
router.use(authenticate);

/**
 * ULTRA-CACHED STUDENT ROUTES
 * Target: 2000ms → <50ms for student details
 */

// Ultra-fast student details (the main fix for your issue)
router.get('/:id', cachedStudentController.getStudentDetails.bind(cachedStudentController));

// Lightning-fast basic student info
router.get('/:id/basic', cachedStudentController.getStudentBasic.bind(cachedStudentController));

// On-demand document loading
router.get('/:id/documents', cachedStudentController.getStudentDocuments.bind(cachedStudentController));

// Cache management routes (admin)
router.delete('/:id/cache', cachedStudentController.clearStudentCache.bind(cachedStudentController));
router.delete('/cache/all', cachedStudentController.clearStudentCache.bind(cachedStudentController));

export default router; 