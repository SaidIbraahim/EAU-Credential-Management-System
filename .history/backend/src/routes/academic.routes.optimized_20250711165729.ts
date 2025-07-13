import { Router } from 'express';
import { OptimizedAcademicController } from '../controllers/academic.controller.optimized';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const academicController = new OptimizedAcademicController();

// All routes require authentication
router.use(authenticate);

/**
 * OPTIMIZED ACADEMIC ROUTES
 * Target: Fix 3000ms+ → <200ms for academic data
 */

// Ultra-fast academic years
router.get('/years', academicController.getAcademicYears.bind(academicController));

// Ultra-fast faculties
router.get('/faculties', academicController.getFaculties.bind(academicController));

// Ultra-fast departments
router.get('/departments', academicController.getDepartments.bind(academicController));

// Departments by faculty
router.get('/departments/faculty/:facultyId', academicController.getDepartmentsByFaculty.bind(academicController));

// Cache management (admin)
router.delete('/cache/clear', academicController.clearAcademicCache.bind(academicController));
router.get('/cache/stats', academicController.getCacheStats.bind(academicController));

export default router; 