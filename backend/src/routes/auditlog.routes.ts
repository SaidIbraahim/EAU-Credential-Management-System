import { Router } from 'express';
import { AuditLogController } from '../controllers/auditlog.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const auditLogController = new AuditLogController();

// All audit log routes require authentication
router.use(authenticate);

// GET /audit-logs - Get all audit logs with filtering and pagination
router.get('/', (req, res, next) => auditLogController.getAll(req, res, next));

// GET /audit-logs/stats - Get audit log statistics
router.get('/stats', (req, res, next) => auditLogController.getStats(req, res, next));

// GET /audit-logs/export - Export audit logs as CSV
router.get('/export', (req, res, next) => auditLogController.exportCsv(req, res, next));

// GET /audit-logs/:id - Get specific audit log by ID
router.get('/:id', (req, res, next) => auditLogController.getById(req, res, next));

// POST /audit-logs - Create new audit log entry
router.post('/', (req, res, next) => auditLogController.create(req, res, next));

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
  return auditLogController.cleanup(req, res, next);
});

export default router; 