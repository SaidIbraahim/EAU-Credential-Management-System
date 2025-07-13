"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditlog_controller_optimized_1 = require("../controllers/optimized/auditlog.controller.optimized");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const optimizedAuditLogController = new auditlog_controller_optimized_1.OptimizedAuditLogController();
router.use(auth_middleware_1.authenticate);
router.get('/', (req, res, next) => optimizedAuditLogController.getAll(req, res, next));
router.get('/stats', (req, res, next) => optimizedAuditLogController.getStats(req, res, next));
router.get('/recent', (req, res, next) => optimizedAuditLogController.getRecent(req, res, next));
router.get('/:id', (req, res, next) => {
    const { AuditLogController } = require('../controllers/auditlog.controller');
    const auditLogController = new AuditLogController();
    return auditLogController.getById(req, res, next);
});
router.post('/', (req, res, next) => {
    const { AuditLogController } = require('../controllers/auditlog.controller');
    const auditLogController = new AuditLogController();
    return auditLogController.create(req, res, next);
});
router.delete('/cleanup', (req, res, next) => {
    const user = req.user;
    if (user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Only Super Admins can cleanup audit logs'
        });
    }
    const { AuditLogController } = require('../controllers/auditlog.controller');
    const auditLogController = new AuditLogController();
    return auditLogController.cleanup(req, res, next);
});
exports.default = router;
//# sourceMappingURL=auditlog.routes.js.map