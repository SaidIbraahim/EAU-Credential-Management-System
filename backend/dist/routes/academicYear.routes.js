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
        const academicYears = await prisma_1.prisma.academicYear.findMany({
            orderBy: { academicYear: 'desc' }
        });
        return res.json(academicYears);
    }
    catch (error) {
        console.error('Error fetching academic years:', error);
        throw new AppError_1.AppError('Failed to fetch academic years', 500);
    }
});
router.post('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { academicYear, isActive } = req.body;
        if (!academicYear) {
            throw new AppError_1.AppError('Academic year is required', 400);
        }
        const academicYearRegex = /^\d{4}-\d{4}$/;
        if (!academicYearRegex.test(academicYear)) {
            throw new AppError_1.AppError('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)', 400);
        }
        const existingAcademicYear = await prisma_1.prisma.academicYear.findUnique({
            where: { academicYear }
        });
        if (existingAcademicYear) {
            throw new AppError_1.AppError('Academic year already exists', 409);
        }
        if (isActive) {
            await prisma_1.prisma.academicYear.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            });
        }
        const newAcademicYear = await prisma_1.prisma.academicYear.create({
            data: {
                academicYear: academicYear.trim(),
                isActive: Boolean(isActive)
            }
        });
        academic_controller_optimized_1.OptimizedAcademicController.clearAcademicCache();
        console.log('✅ Backend academic cache cleared after creating academic year');
        return res.status(201).json(newAcademicYear);
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error creating academic year:', error);
        throw new AppError_1.AppError('Failed to create academic year', 500);
    }
});
router.put('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { academicYear, isActive } = req.body;
        if (isNaN(id)) {
            throw new AppError_1.AppError('Invalid academic year ID', 400);
        }
        if (!academicYear) {
            throw new AppError_1.AppError('Academic year is required', 400);
        }
        const academicYearRegex = /^\d{4}-\d{4}$/;
        if (!academicYearRegex.test(academicYear)) {
            throw new AppError_1.AppError('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)', 400);
        }
        const existingAcademicYear = await prisma_1.prisma.academicYear.findUnique({
            where: { id }
        });
        if (!existingAcademicYear) {
            throw new AppError_1.AppError('Academic year not found', 404);
        }
        const duplicateAcademicYear = await prisma_1.prisma.academicYear.findFirst({
            where: {
                academicYear: academicYear.trim(),
                id: { not: id }
            }
        });
        if (duplicateAcademicYear) {
            throw new AppError_1.AppError('Academic year already exists', 409);
        }
        if (isActive && !existingAcademicYear.isActive) {
            await prisma_1.prisma.academicYear.updateMany({
                where: {
                    isActive: true,
                    id: { not: id }
                },
                data: { isActive: false }
            });
        }
        const updatedAcademicYear = await prisma_1.prisma.academicYear.update({
            where: { id },
            data: {
                academicYear: academicYear.trim(),
                isActive: Boolean(isActive)
            }
        });
        academic_controller_optimized_1.OptimizedAcademicController.clearAcademicCache();
        console.log('✅ Backend academic cache cleared after updating academic year');
        return res.json(updatedAcademicYear);
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error updating academic year:', error);
        throw new AppError_1.AppError('Failed to update academic year', 500);
    }
});
router.delete('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new AppError_1.AppError('Invalid academic year ID', 400);
        }
        const existingAcademicYear = await prisma_1.prisma.academicYear.findUnique({
            where: { id }
        });
        if (!existingAcademicYear) {
            throw new AppError_1.AppError('Academic year not found', 404);
        }
        const studentCount = await prisma_1.prisma.student.count({
            where: { academicYearId: id }
        });
        if (studentCount > 0) {
            throw new AppError_1.AppError('Cannot delete academic year with associated students', 409);
        }
        await prisma_1.prisma.academicYear.delete({
            where: { id }
        });
        academic_controller_optimized_1.OptimizedAcademicController.clearAcademicCache();
        console.log('✅ Backend academic cache cleared after deleting academic year');
        return res.json({ message: 'Academic year deleted successfully' });
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error deleting academic year:', error);
        throw new AppError_1.AppError('Failed to delete academic year', 500);
    }
});
exports.default = router;
//# sourceMappingURL=academicYear.routes.js.map