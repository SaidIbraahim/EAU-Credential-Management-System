"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("../controllers/student.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', student_controller_1.StudentController.getAll);
router.get('/validation', student_controller_1.StudentController.getAllForValidation);
router.get('/:id', student_controller_1.StudentController.getById);
router.post('/', (0, auth_middleware_1.authorize)('ADMIN', 'SUPER_ADMIN'), student_controller_1.StudentController.create);
router.put('/:id', (0, auth_middleware_1.authorize)('ADMIN', 'SUPER_ADMIN'), student_controller_1.StudentController.update);
router.delete('/:id', (0, auth_middleware_1.authorize)('ADMIN', 'SUPER_ADMIN'), student_controller_1.StudentController.delete);
router.post('/bulk', (0, auth_middleware_1.authorize)('ADMIN', 'SUPER_ADMIN'), student_controller_1.StudentController.bulkCreate);
exports.default = router;
//# sourceMappingURL=student.routes.js.map