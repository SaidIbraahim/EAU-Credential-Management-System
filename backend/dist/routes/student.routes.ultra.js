"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_ultra_1 = require("../controllers/student.controller.ultra");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const studentController = new student_controller_ultra_1.UltraStudentController();
router.use(auth_middleware_1.authenticate);
router.get('/', studentController.getStudents.bind(studentController));
router.get('/search', studentController.searchStudents.bind(studentController));
router.get('/stats', studentController.getStudentStats.bind(studentController));
router.get('/:id', studentController.getStudent.bind(studentController));
router.delete('/cache/clear', studentController.clearCache.bind(studentController));
router.get('/cache/stats', studentController.getCacheStats.bind(studentController));
exports.default = router;
//# sourceMappingURL=student.routes.ultra.js.map