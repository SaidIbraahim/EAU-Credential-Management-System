import { Router } from 'express';
import { OptimizedAcademicController } from '../controllers/academic.controller.optimized';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const academicController = new OptimizedAcademicController();

/**
 * OPTIMIZED ACADEMIC ROUTES - PUBLIC ACCESS
 * Target: Fix 3000ms+ → <200ms for academic data
 * Note: These endpoints are public since academic data is needed for login/registration forms
 */

// Ultra-fast academic years (PUBLIC)
router.get('/years', academicController.getAcademicYears.bind(academicController));

// Ultra-fast faculties (PUBLIC)
router.get('/faculties', academicController.getFaculties.bind(academicController));

// Ultra-fast departments (PUBLIC)
router.get('/departments', academicController.getDepartments.bind(academicController));

// Departments by faculty (PUBLIC)
router.get('/departments/faculty/:facultyId', academicController.getDepartmentsByFaculty.bind(academicController));

// Cache management (PROTECTED - admin only)
router.delete('/cache/clear', authenticate, academicController.clearAcademicCache.bind(academicController));
router.get('/cache/stats', authenticate, academicController.getCacheStats.bind(academicController));

export default router; 