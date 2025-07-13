import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/dashboard/stats
 * @desc Get comprehensive dashboard statistics
 * @access Private - Admin only
 */
router.get('/stats', authenticateToken, DashboardController.getStats);

/**
 * @route GET /api/dashboard/quick-stats
 * @desc Get quick overview statistics for dashboard cards
 * @access Private - Admin only
 */
router.get('/quick-stats', authenticateToken, DashboardController.getQuickStats);

export default router; 