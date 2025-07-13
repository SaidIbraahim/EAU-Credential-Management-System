import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { authenticate } from '../middleware/auth.middleware';
import { OptimizedAcademicController } from '../controllers/academic.controller.optimized';

const router = Router();

// Get all departments (PUBLIC - no authentication required)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        faculty: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw new AppError('Failed to fetch departments', 500);
  }
});

// Get departments by faculty (PUBLIC - no authentication required)
router.get('/faculty/:facultyId', async (req: Request, res: Response) => {
  try {
    const { facultyId } = req.params;
    const facultyIdNum = parseInt(facultyId);

    if (isNaN(facultyIdNum)) {
      throw new AppError('Invalid faculty ID', 400);
    }

    const departments = await prisma.department.findMany({
      where: { facultyId: facultyIdNum },
      include: {
        faculty: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.json(departments);
  } catch (error) {
    console.error('Error fetching departments by faculty:', error);
    throw new AppError('Failed to fetch departments by faculty', 500);
  }
});

// Create a new department (PROTECTED)
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, code, description, facultyId } = req.body;

    if (!name || !code || !facultyId) {
      throw new AppError('Name, code, and faculty ID are required', 400);
    }

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: parseInt(facultyId) }
    });

    if (!faculty) {
      throw new AppError('Faculty not found', 404);
    }

    // Check if department with same code already exists
    const existingDepartment = await prisma.department.findUnique({
      where: { code }
    });

    if (existingDepartment) {
      throw new AppError('Department with this code already exists', 409);
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        facultyId: parseInt(facultyId)
      },
      include: {
        faculty: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    // 🚀 CRITICAL FIX: Clear backend cache after successful creation
    OptimizedAcademicController.clearAcademicCache();
    console.log('✅ Backend academic cache cleared after creating department');

    return res.status(201).json(department);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error creating department:', error);
    throw new AppError('Failed to create department', 500);
  }
});

// Update a department (PROTECTED)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, code, description, facultyId } = req.body;

    if (isNaN(id)) {
      throw new AppError('Invalid department ID', 400);
    }

    if (!name || !code || !facultyId) {
      throw new AppError('Name, code, and faculty ID are required', 400);
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      throw new AppError('Department not found', 404);
    }

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: parseInt(facultyId) }
    });

    if (!faculty) {
      throw new AppError('Faculty not found', 404);
    }

    // Check if another department with same code exists
    const duplicateDepartment = await prisma.department.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        id: { not: id }
      }
    });

    if (duplicateDepartment) {
      throw new AppError('Department with this code already exists', 409);
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        facultyId: parseInt(facultyId)
      },
      include: {
        faculty: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    // 🚀 CRITICAL FIX: Clear backend cache after successful update
    OptimizedAcademicController.clearAcademicCache();
    console.log('✅ Backend academic cache cleared after updating department');

    return res.json(department);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error updating department:', error);
    throw new AppError('Failed to update department', 500);
  }
});

// Delete a department (PROTECTED)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new AppError('Invalid department ID', 400);
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      throw new AppError('Department not found', 404);
    }

    // Check if department has associated students
    const studentCount = await prisma.student.count({
      where: { departmentId: id }
    });

    if (studentCount > 0) {
      throw new AppError('Cannot delete department with associated students', 409);
    }

    await prisma.department.delete({
      where: { id }
    });

    // 🚀 CRITICAL FIX: Clear backend cache after successful deletion
    OptimizedAcademicController.clearAcademicCache();
    console.log('✅ Backend academic cache cleared after deleting department');

    return res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error deleting department:', error);
    throw new AppError('Failed to delete department', 500);
  }
});

export default router; 