"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_simple_1 = require("../controllers/student.controller.simple");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const simpleStudentController = new student_controller_simple_1.SimpleStudentController();
router.use(auth_middleware_1.authenticate);
router.get('/', simpleStudentController.getStudentList.bind(simpleStudentController));
router.get('/validation', simpleStudentController.getStudentValidation.bind(simpleStudentController));
router.post('/', simpleStudentController.createStudent.bind(simpleStudentController));
router.post('/bulk', simpleStudentController.bulkCreateStudents.bind(simpleStudentController));
router.put('/:id', simpleStudentController.updateStudent.bind(simpleStudentController));
router.delete('/:id', simpleStudentController.deleteStudent.bind(simpleStudentController));
router.get('/:id', simpleStudentController.getStudentDetails.bind(simpleStudentController));
exports.default = router;
//# sourceMappingURL=student.routes.simple.js.map