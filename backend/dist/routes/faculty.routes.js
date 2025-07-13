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
        const faculties = await prisma_1.prisma.faculty.findMany({
            orderBy: { name: 'asc' }
        });
        return res.json(faculties);
    }
    catch (error) {
        console.error('Error fetching faculties:', error);
        throw new AppError_1.AppError('Failed to fetch faculties', 500);
    }
});
router.post('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { name, code, description } = req.body;
        if (!name || !code) {
            throw new AppError_1.AppError('Name and code are required', 400);
        }
        const existingFaculty = await prisma_1.prisma.faculty.findUnique({
            where: { code }
        });
        if (existingFaculty) {
            throw new AppError_1.AppError('Faculty with this code already exists', 409);
        }
        const faculty = await prisma_1.prisma.faculty.create({
            data: {
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: (description === null || description === void 0 ? void 0 : description.trim()) || null
            }
        });
        academic_controller_optimized_1.OptimizedAcademicController.clearAcademicCache();
        console.log('✅ Backend academic cache cleared after creating faculty');
        return res.status(201).json(faculty);
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error creating faculty:', error);
        throw new AppError_1.AppError('Failed to create faculty', 500);
    }
});
router.put('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, code, description } = req.body;
        if (isNaN(id)) {
            throw new AppError_1.AppError('Invalid faculty ID', 400);
        }
        if (!name || !code) {
            throw new AppError_1.AppError('Name and code are required', 400);
        }
        const existingFaculty = await prisma_1.prisma.faculty.findUnique({
            where: { id }
        });
        if (!existingFaculty) {
            throw new AppError_1.AppError('Faculty not found', 404);
        }
        const duplicateFaculty = await prisma_1.prisma.faculty.findFirst({
            where: {
                code: code.trim().toUpperCase(),
                id: { not: id }
            }
        });
        if (duplicateFaculty) {
            throw new AppError_1.AppError('Faculty with this code already exists', 409);
        }
        const faculty = await prisma_1.prisma.faculty.update({
            where: { id },
            data: {
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: (description === null || description === void 0 ? void 0 : description.trim()) || null
            }
        });
        academic_controller_optimized_1.OptimizedAcademicController.clearAcademicCache();
        console.log('✅ Backend academic cache cleared after updating faculty');
        return res.json(faculty);
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error updating faculty:', error);
        throw new AppError_1.AppError('Failed to update faculty', 500);
    }
});
router.delete('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new AppError_1.AppError('Invalid faculty ID', 400);
        }
        const existingFaculty = await prisma_1.prisma.faculty.findUnique({
            where: { id }
        });
        if (!existingFaculty) {
            throw new AppError_1.AppError('Faculty not found', 404);
        }
        const departmentCount = await prisma_1.prisma.department.count({
            where: { facultyId: id }
        });
        if (departmentCount > 0) {
            throw new AppError_1.AppError('Cannot delete faculty with associated departments', 409);
        }
        const studentCount = await prisma_1.prisma.student.count({
            where: { facultyId: id }
        });
        if (studentCount > 0) {
            throw new AppError_1.AppError('Cannot delete faculty with associated students', 409);
        }
        await prisma_1.prisma.faculty.delete({
            where: { id }
        });
        academic_controller_optimized_1.OptimizedAcademicController.clearAcademicCache();
        console.log('✅ Backend academic cache cleared after deleting faculty');
        return res.json({ message: 'Faculty deleted successfully' });
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error deleting faculty:', error);
        throw new AppError_1.AppError('Failed to delete faculty', 500);
    }
});
exports.default = router;
//# sourceMappingURL=faculty.routes.js.map