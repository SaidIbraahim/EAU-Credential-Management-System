import { Router } from 'express';
import { OptimizedAuditLogController } from '../controllers/optimized/auditlog.controller.optimized';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const optimizedAuditLogController = new OptimizedAuditLogController();

// All audit log routes require authentication
router.use(authenticate);

// GET /audit-logs - Get all audit logs with filtering and pagination (OPTIMIZED)
router.get('/', (req, res, next) => optimizedAuditLogController.getAll(req, res, next));

// GET /audit-logs/stats - Get audit log statistics (OPTIMIZED WITH RAW SQL)
router.get('/stats', (req, res, next) => optimizedAuditLogController.getStats(req, res, next));

// GET /audit-logs/recent - Get recent audit logs for dashboard (OPTIMIZED)
router.get('/recent', (req, res, next) => optimizedAuditLogController.getRecent(req, res, next));

// GET /audit-logs/:id - Get specific audit log by ID (legacy fallback)
router.get('/:id', (req, res, next) => {
  // For single audit log, use the original controller as it's not performance-critical
  const { AuditLogController } = require('../controllers/auditlog.controller');
  const auditLogController = new AuditLogController();
  return auditLogController.getById(req, res, next);
});

// POST /audit-logs - Create new audit log entry (legacy fallback)
router.post('/', (req, res, next) => {
  // For creation, use the original controller as it's not performance-critical
  const { AuditLogController } = require('../controllers/auditlog.controller');
  const auditLogController = new AuditLogController();
  return auditLogController.create(req, res, next);
});

// DELETE /audit-logs/cleanup - Cleanup old audit logs (Super Admin only)
router.delete('/cleanup', (req, res, next) => {
  // Check if user is Super Admin
  const user = (req as any).user;
  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Only Super Admins can cleanup audit logs'
    });
  }
  // Use original controller for cleanup as it's not performance-critical
  const { AuditLogController } = require('../controllers/auditlog.controller');
  const auditLogController = new AuditLogController();
  return auditLogController.cleanup(req, res, next);
});

export default router; 