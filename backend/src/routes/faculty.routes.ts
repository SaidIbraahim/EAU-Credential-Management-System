import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { authenticate } from '../middleware/auth.middleware';
import { OptimizedAcademicController } from '../controllers/academic.controller.optimized';

const router = Router();

// Get all faculties (PUBLIC - no authentication required)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const faculties = await prisma.faculty.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json(faculties);
  } catch (error) {
    console.error('Error fetching faculties:', error);
    throw new AppError('Failed to fetch faculties', 500);
  }
});

// Create a new faculty (PROTECTED)
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      throw new AppError('Name and code are required', 400);
    }

    // Check if faculty with same code already exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { code }
    });

    if (existingFaculty) {
      throw new AppError('Faculty with this code already exists', 409);
    }

    const faculty = await prisma.faculty.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null
      }
    });

    // 🚀 CRITICAL FIX: Clear backend cache after successful creation
    OptimizedAcademicController.clearAcademicCache();
    console.log('✅ Backend academic cache cleared after creating faculty');

    return res.status(201).json(faculty);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error creating faculty:', error);
    throw new AppError('Failed to create faculty', 500);
  }
});

// Update a faculty (PROTECTED)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, code, description } = req.body;

    if (isNaN(id)) {
      throw new AppError('Invalid faculty ID', 400);
    }

    if (!name || !code) {
      throw new AppError('Name and code are required', 400);
    }

    // Check if faculty exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { id }
    });

    if (!existingFaculty) {
      throw new AppError('Faculty not found', 404);
    }

    // Check if another faculty with same code exists
    const duplicateFaculty = await prisma.faculty.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        id: { not: id }
      }
    });

    if (duplicateFaculty) {
      throw new AppError('Faculty with this code already exists', 409);
    }

    const faculty = await prisma.faculty.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null
      }
    });

    // 🚀 CRITICAL FIX: Clear backend cache after successful update
    OptimizedAcademicController.clearAcademicCache();
    console.log('✅ Backend academic cache cleared after updating faculty');

    return res.json(faculty);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error updating faculty:', error);
    throw new AppError('Failed to update faculty', 500);
  }
});

// Delete a faculty (PROTECTED)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new AppError('Invalid faculty ID', 400);
    }

    // Check if faculty exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { id }
    });

    if (!existingFaculty) {
      throw new AppError('Faculty not found', 404);
    }

    // Check if faculty has associated departments
    const departmentCount = await prisma.department.count({
      where: { facultyId: id }
    });

    if (departmentCount > 0) {
      throw new AppError('Cannot delete faculty with associated departments', 409);
    }

    // Check if faculty has associated students
    const studentCount = await prisma.student.count({
      where: { facultyId: id }
    });

    if (studentCount > 0) {
      throw new AppError('Cannot delete faculty with associated students', 409);
    }

    await prisma.faculty.delete({
      where: { id }
    });

    // 🚀 CRITICAL FIX: Clear backend cache after successful deletion
    OptimizedAcademicController.clearAcademicCache();
    console.log('✅ Backend academic cache cleared after deleting faculty');

    return res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error deleting faculty:', error);
    throw new AppError('Failed to delete faculty', 500);
  }
});

export default router; 