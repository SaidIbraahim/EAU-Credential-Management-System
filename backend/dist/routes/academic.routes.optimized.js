"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academic_controller_optimized_1 = require("../controllers/academic.controller.optimized");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const academicController = new academic_controller_optimized_1.OptimizedAcademicController();
router.get('/years', academicController.getAcademicYears.bind(academicController));
router.get('/faculties', academicController.getFaculties.bind(academicController));
router.get('/departments', academicController.getDepartments.bind(academicController));
router.get('/departments/faculty/:facultyId', academicController.getDepartmentsByFaculty.bind(academicController));
router.delete('/cache/clear', auth_middleware_1.authenticate, academicController.clearAcademicCache.bind(academicController));
router.get('/cache/stats', auth_middleware_1.authenticate, academicController.getCacheStats.bind(academicController));
exports.default = router;
//# sourceMappingURL=academic.routes.optimized.js.map