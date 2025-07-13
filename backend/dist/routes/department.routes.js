"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const AppError_1 = require("../utils/AppError");
const auth_middleware_1 = require("../middleware/auth.middleware");
const academic_controller_optimized_1 = require("../controllers/academic.controller.optimized");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    try {
        const departments = await prisma_1.prisma.department.findMany({
            include: {
                faculty: {
                    select: { id: true, name: true, code: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        return res.json(departments);
    }
    catch (error) {
        console.error('Error fetching departments:', error);
        throw new AppError_1.AppError('Failed to fetch departments', 500);
    }
});
router.get('/faculty/:facultyId', async (req, res) => {
    try {
        const { facultyId } = req.params;
        const facultyIdNum = parseInt(facultyId);
        if (isNaN(facultyIdNum)) {
            throw new AppError_1.AppError('Invalid faculty ID', 400);
        }
        const departments = await prisma_1.prisma.department.findMany({
            where: { facultyId: facultyIdNum },
            include: {
                faculty: {
                    select: { id: true, name: true, code: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        return res.json(departments);
    }
    catch (error) {
        console.error('Error fetching departments by faculty:', error);
        throw new AppError_1.AppError('Failed to fetch departments by faculty', 500);
    }
});
router.post('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { name, code, description, facultyId } = req.body;
        if (!name || !code || !facultyId) {
            throw new AppError_1.AppError('Name, code, and faculty ID are required', 400);
        }
        const faculty = await prisma_1.prisma.faculty.findUnique({
            where: { id: parseInt(facultyId) }
        });
        if (!faculty) {
            throw new AppError_1.AppError('Faculty not found', 404);
        }
        const existingDepartment = await prisma_1.prisma.department.findUnique({
            where: { code }
        });
        if (existingDepartment) {
            throw new AppError_1.AppError('Department with this code already exists', 409);
        }
        const department = await prisma_1.prisma.department.create({
            data: {
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
                facultyId: parseInt(facultyId)
            },
            include: {
                faculty: {
                    select: { id: true, name: true, code: true }
                }
            }
        });
        academic_controller_optimized_1.OptimizedAcademicController.clearAcademicCache();
        console.log('✅ Backend academic cache cleared after creating department');
        return res.status(201).json(department);
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error creating department:', error);
        throw new AppError_1.AppError('Failed to create department', 500);
    }
});
router.put('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, code, description, facultyId } = req.body;
        if (isNaN(id)) {
            throw new AppError_1.AppError('Invalid department ID', 400);
        }
        if (!name || !code || !facultyId) {
            throw new AppError_1.AppError('Name, code, and faculty ID are required', 400);
        }
        const existingDepartment = await prisma_1.prisma.department.findUnique({
            where: { id }
        });
        if (!existingDepartment) {
            throw new AppError_1.AppError('Department not found', 404);
        }
        const faculty = await prisma_1.prisma.faculty.findUnique({
            where: { id: parseInt(facultyId) }
        });
        if (!faculty) {
            throw new AppError_1.AppError('Faculty not found', 404);
        }
        const duplicateDepartment = await prisma_1.prisma.department.findFirst({
            where: {
                code: code.trim().toUpperCase(),
                id: { not: id }
            }
        });
        if (duplicateDepartment) {
            throw new AppError_1.AppError('Department with this code already exists', 409);
        }
        const department = await prisma_1.prisma.department.update({
            where: { id },
            data: {
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
                facultyId: parseInt(facultyId)
            },
            include: {
                faculty: {
                    select: { id: true, name: true, code: true }
                }
            }
        });
        academic_controller_optimized_1.OptimizedAcademicController.clearAcademicCache();
        console.log('✅ Backend academic cache cleared after updating department');
        return res.json(department);
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error updating department:', error);
        throw new AppError_1.AppError('Failed to update department', 500);
    }
});
router.delete('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new AppError_1.AppError('Invalid department ID', 400);
        }
        const existingDepartment = await prisma_1.prisma.department.findUnique({
            where: { id }
        });
        if (!existingDepartment) {
            throw new AppError_1.AppError('Department not found', 404);
        }
        const studentCount = await prisma_1.prisma.student.count({
            where: { departmentId: id }
        });
        if (studentCount > 0) {
            throw new AppError_1.AppError('Cannot delete department with associated students', 409);
        }
        await prisma_1.prisma.department.delete({
            where: { id }
        });
        academic_controller_optimized_1.OptimizedAcademicController.clearAcademicCache();
        console.log('✅ Backend academic cache cleared after deleting department');
        return res.json({ message: 'Department deleted successfully' });
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error deleting department:', error);
        throw new AppError_1.AppError('Failed to delete department', 500);
    }
});
exports.default = router;
//# sourceMappingURL=department.routes.js.map