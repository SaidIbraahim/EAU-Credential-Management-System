"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const student_controller_optimized_1 = __importDefault(require("../controllers/optimized/student.controller.optimized"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.use((0, auth_middleware_1.authorize)('ADMIN', 'SUPER_ADMIN'));
router.get('/', async (req, res, next) => {
    console.time('⚡ Student List Route');
    try {
        await student_controller_optimized_1.default.getAll(req, res);
    }
    catch (error) {
        next(error);
    }
    finally {
        console.timeEnd('⚡ Student List Route');
    }
});
router.get('/search', async (req, res, next) => {
    console.time('⚡ Student Search Route');
    try {
        await student_controller_optimized_1.default.search(req, res);
    }
    catch (error) {
        next(error);
    }
    finally {
        console.timeEnd('⚡ Student Search Route');
    }
});
router.get('/validation', async (req, res, next) => {
    console.time('⚡ Student Validation Route');
    try {
        await student_controller_optimized_1.default.getAllForValidation(req, res);
    }
    catch (error) {
        next(error);
    }
    finally {
        console.timeEnd('⚡ Student Validation Route');
    }
});
router.get('/:id', async (req, res, next) => {
    console.time('⚡ Student Detail Route');
    try {
        await student_controller_optimized_1.default.getById(req, res);
    }
    catch (error) {
        next(error);
    }
    finally {
        console.timeEnd('⚡ Student Detail Route');
    }
});
router.post('/', async (req, res, next) => {
    console.time('⚡ Student Creation Route');
    try {
        await student_controller_optimized_1.default.create(req, res);
    }
    catch (error) {
        next(error);
    }
    finally {
        console.timeEnd('⚡ Student Creation Route');
    }
});
exports.default = router;
//# sourceMappingURL=student.routes.optimized.js.map