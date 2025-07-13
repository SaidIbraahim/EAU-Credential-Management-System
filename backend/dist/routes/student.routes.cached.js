"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_cached_1 = require("../controllers/student.controller.cached");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const cachedStudentController = new student_controller_cached_1.CachedStudentController();
router.use(auth_middleware_1.authenticate);
router.get('/:id', cachedStudentController.getStudentDetails.bind(cachedStudentController));
router.get('/:id/basic', cachedStudentController.getStudentBasic.bind(cachedStudentController));
router.get('/:id/documents', cachedStudentController.getStudentDocuments.bind(cachedStudentController));
router.delete('/:id/cache', cachedStudentController.clearStudentCache.bind(cachedStudentController));
router.delete('/cache/all', cachedStudentController.clearStudentCache.bind(cachedStudentController));
exports.default = router;
//# sourceMappingURL=student.routes.cached.js.map