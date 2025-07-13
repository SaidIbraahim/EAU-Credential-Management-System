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

// Optimized student details (the main fix!)
router.get('/:id', simpleStudentController.getStudentDetails.bind(simpleStudentController));

export default router; 