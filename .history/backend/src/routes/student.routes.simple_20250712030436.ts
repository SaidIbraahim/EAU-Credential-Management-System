import { Router } from 'express';
import { SimpleStudentController } from '../controllers/student.controller.simple';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const simpleStudentController = new SimpleStudentController();

// All routes require authentication
router.use(authenticate);

/**
 * SIMPLE OPTIMIZED STUDENT ROUTES
 * Target: Fix 2000ms → <500ms student details
 */

// Optimized student list
router.get('/', simpleStudentController.getStudentList.bind(simpleStudentController));

// CRITICAL: Validation route MUST be before /:id route to prevent conflicts
router.get('/validation', simpleStudentController.getStudentValidation.bind(simpleStudentController));

// Create new student (admin only)
router.post('/', simpleStudentController.createStudent.bind(simpleStudentController));

// Bulk create students (admin only)
router.post('/bulk', simpleStudentController.bulkCreateStudents.bind(simpleStudentController));

// Optimized student details (the main fix!)
router.get('/:id', simpleStudentController.getStudentDetails.bind(simpleStudentController));

export default router; 