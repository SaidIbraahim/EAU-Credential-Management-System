import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/dashboard/stats
 * @desc Get comprehensive dashboard statistics
 * @access Private - Admin only
 */
router.get('/stats', authenticate, DashboardController.getStats);

/**
 * @route GET /api/dashboard/quick-stats
 * @desc Get quick overview statistics for dashboard cards
 * @access Private - Admin only
 */
router.get('/quick-stats', authenticate, DashboardController.getQuickStats);

/**
 * @route GET /api/dashboard/reports
 * @desc Get comprehensive reports data for Reports page
 * @access Private - Admin only
 */
router.get('/reports', authenticate, DashboardController.getReports);

export default router; 