import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { authenticate } from '../middleware/auth.middleware';
import { OptimizedAcademicController } from '../controllers/academic.controller.optimized';

const router = Router();

// Get all academic years (PUBLIC - no authentication required)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const academicYears = await prisma.academicYear.findMany({
      orderBy: { academicYear: 'desc' }
    });
    return res.json(academicYears);
  } catch (error) {
    console.error('Error fetching academic years:', error);
    throw new AppError('Failed to fetch academic years', 500);
  }
});

// Create a new academic year (PROTECTED)
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { academicYear, isActive } = req.body;

    if (!academicYear) {
      throw new AppError('Academic year is required', 400);
    }

    // Validate academic year format (e.g., "2023-2024")
    const academicYearRegex = /^\d{4}-\d{4}$/;
    if (!academicYearRegex.test(academicYear)) {
      throw new AppError('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)', 400);
    }

    // Check if academic year already exists
    const existingAcademicYear = await prisma.academicYear.findUnique({
      where: { academicYear }
    });

    if (existingAcademicYear) {
      throw new AppError('Academic year already exists', 409);
    }

    // If setting as active, deactivate all other academic years
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const newAcademicYear = await prisma.academicYear.create({
      data: {
        academicYear: academicYear.trim(),
        isActive: Boolean(isActive)
      }
    });

    // 🚀 CRITICAL FIX: Clear backend cache after successful creation
    OptimizedAcademicController.clearAcademicCache();
    console.log('✅ Backend academic cache cleared after creating academic year');

    return res.status(201).json(newAcademicYear);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error creating academic year:', error);
    throw new AppError('Failed to create academic year', 500);
  }
});

// Update an academic year (PROTECTED)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { academicYear, isActive } = req.body;

    if (isNaN(id)) {
      throw new AppError('Invalid academic year ID', 400);
    }

    if (!academicYear) {
      throw new AppError('Academic year is required', 400);
    }

    // Validate academic year format
    const academicYearRegex = /^\d{4}-\d{4}$/;
    if (!academicYearRegex.test(academicYear)) {
      throw new AppError('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)', 400);
    }

    // Check if academic year exists
    const existingAcademicYear = await prisma.academicYear.findUnique({
      where: { id }
    });

    if (!existingAcademicYear) {
      throw new AppError('Academic year not found', 404);
    }

    // Check if another academic year with same name exists
    const duplicateAcademicYear = await prisma.academicYear.findFirst({
      where: {
        academicYear: academicYear.trim(),
        id: { not: id }
      }
    });

    if (duplicateAcademicYear) {
      throw new AppError('Academic year already exists', 409);
    }

    // If setting as active, deactivate all other academic years
    if (isActive && !existingAcademicYear.isActive) {
      await prisma.academicYear.updateMany({
        where: { 
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false }
      });
    }

    const updatedAcademicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        academicYear: academicYear.trim(),
        isActive: Boolean(isActive)
      }
    });

    // 🚀 CRITICAL FIX: Clear backend cache after successful update
    OptimizedAcademicController.clearAcademicCache();
    console.log('✅ Backend academic cache cleared after updating academic year');

    return res.json(updatedAcademicYear);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error updating academic year:', error);
    throw new AppError('Failed to update academic year', 500);
  }
});

// Delete an academic year (PROTECTED)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new AppError('Invalid academic year ID', 400);
    }

    // Check if academic year exists
    const existingAcademicYear = await prisma.academicYear.findUnique({
      where: { id }
    });

    if (!existingAcademicYear) {
      throw new AppError('Academic year not found', 404);
    }

    // Check if academic year has associated students
    const studentCount = await prisma.student.count({
      where: { academicYearId: id }
    });

    if (studentCount > 0) {
      throw new AppError('Cannot delete academic year with associated students', 409);
    }

    await prisma.academicYear.delete({
      where: { id }
    });

    // 🚀 CRITICAL FIX: Clear backend cache after successful deletion
    OptimizedAcademicController.clearAcademicCache();
    console.log('✅ Backend academic cache cleared after deleting academic year');

    return res.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error deleting academic year:', error);
    throw new AppError('Failed to delete academic year', 500);
  }
});

export default router; 