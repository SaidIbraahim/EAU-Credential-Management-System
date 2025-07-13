import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { z } from 'zod';

/**
 * SIMPLE OPTIMIZED Student Controller
 * Target: Fix 2000ms student details → <500ms
 * 
 * Strategy: Optimized queries without complex caching
 */

// Simple in-memory cache for student details
const studentDetailsCache = new Map<number, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Validation schema for student creation
const studentSchema = z.object({
  registrationId: z.string().min(3),
  certificateId: z.string().optional(),
  fullName: z.string().min(2),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  phone: z.string().optional(),
  departmentId: z.number(),
  facultyId: z.number(),
  academicYearId: z.number(),
  gpa: z.number().min(0).max(4).optional(),
  grade: z.string().optional(),
  graduationDate: z.string().transform(str => new Date(str)).optional(),
  status: z.enum(['CLEARED', 'UN_CLEARED']).default('UN_CLEARED')
});

export class SimpleStudentController {
  
  /**
   * OPTIMIZED STUDENT CREATION
   * Target: Fast student registration with minimal overhead
   */
  async createStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Student Creation Performance');
      
      const validatedData = studentSchema.parse(req.body);
      
      // Fast duplicate check using indexed unique fields
      const existingStudent = await prisma.student.findFirst({
        where: {
          OR: [
            { registrationId: validatedData.registrationId },
            ...(validatedData.certificateId ? [{ certificateId: validatedData.certificateId }] : [])
          ]
        },
        select: { id: true, registrationId: true }
      });

      if (existingStudent) {
        throw new AppError('Student with this registration ID or certificate ID already exists', 400);
      }

      // Create student with minimal relation loading for faster response
      const student = await prisma.student.create({
        data: validatedData,
        select: {
          id: true,
          registrationId: true,
          certificateId: true,
          fullName: true,
          gender: true,
          phone: true,
          gpa: true,
          grade: true,
          graduationDate: true,
          status: true,
          createdAt: true,
          department: { select: { id: true, name: true, code: true } },
          faculty: { select: { id: true, name: true, code: true } },
          academicYear: { select: { id: true, academicYear: true } }
        }
      });

      console.timeEnd('⚡ Student Creation Performance');
      console.log(`⚡ Created student ${student.registrationId}`);
      
      return res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      console.error('❌ Student creation error:', error);
      next(error);
    }
  }

  /**
   * BULK CREATE STUDENTS
   * Target: Optimized bulk import functionality
   */
  async bulkCreateStudents(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Bulk Student Creation');
      
      const students = z.array(studentSchema).parse(req.body.students);
      
      // Check for duplicates
      const registrationIds = students.map(s => s.registrationId);
      const certificateIds = students.filter(s => s.certificateId).map(s => s.certificateId!);

      const existingStudents = await prisma.student.findMany({
        where: {
          OR: [
            { registrationId: { in: registrationIds } },
            ...(certificateIds.length > 0 ? [{ certificateId: { in: certificateIds } }] : [])
          ]
        },
        select: { registrationId: true, certificateId: true, fullName: true }
      });

      if (existingStudents.length > 0) {
        console.log('🚨 Duplicate students found during bulk create:', existingStudents);
        
        return res.status(400).json({
          error: 'Some students already exist in the database',
          message: `Found ${existingStudents.length} duplicate student(s). Please remove duplicates and try again.`,
          duplicateCount: existingStudents.length,
          conflictingIds: existingStudents.map(s => s.registrationId),
          duplicateDetails: existingStudents
        });
      }

      const createdStudents = await prisma.student.createMany({
        data: students,
        skipDuplicates: true
      });

      console.timeEnd('⚡ Bulk Student Creation');
      console.log(`⚡ Created ${createdStudents.count} students`);

      return res.status(201).json({
        success: true,
        count: createdStudents.count,
        students: students
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.errors,
          message: 'Please check the data format and required fields'
        });
      }
      console.error('❌ Bulk student creation error:', error);
      next(error);
    }
  }

  /**
   * OPTIMIZED STUDENT DETAILS
   * Target: 2000ms → <500ms first load, <50ms cached
   */
  async getStudentDetails(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      if (isNaN(studentId)) {
        throw new AppError('Invalid student ID', 400);
      }

      console.time('⚡ Simple Student Details');

      // Check simple cache first
      const cached = studentDetailsCache.get(studentId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('⚡ Student details served from cache');
        console.timeEnd('⚡ Simple Student Details');
        return res.json({ 
          data: cached.data,
          cached: true
        });
      }

      console.time('🔍 Optimized Student Query');
      
      // OPTIMIZED: Separate student data and documents for better performance
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          registrationId: true,
          certificateId: true,
          fullName: true,
          gender: true,
          phone: true,
          gpa: true,
          grade: true,
          graduationDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          
          // Related data with selective fields only
          department: {
            select: { id: true, name: true, code: true }
          },
          faculty: {
            select: { id: true, name: true, code: true }
          },
          academicYear: {
            select: { id: true, academicYear: true }
          },
          
          // Documents with essential data for display
          documents: {
            select: {
              id: true,
              documentType: true,
              fileName: true,
              fileSize: true,
              fileType: true,
              fileUrl: true, // CRITICAL: Required for document display/download
              uploadDate: true
            },
            orderBy: { uploadDate: 'desc' },
            take: 10 // Limit documents for faster loading
          }
        }
      });

      console.timeEnd('🔍 Optimized Student Query');

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      // Cache the result
      studentDetailsCache.set(studentId, {
        data: student,
        timestamp: Date.now()
      });

      console.log(`⚡ Loaded student ${student.registrationId} (cached for 5 minutes)`);
      console.timeEnd('⚡ Simple Student Details');

      return res.json({ 
        data: student,
        cached: false,
        optimized: true
      });

    } catch (error) {
      console.error('❌ Student details error:', error);
      next(error);
    }
  }

  /**
   * OPTIMIZED STUDENT LIST (reuse existing optimized logic)
   */
  async getStudentList(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Optimized Student List');
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          skip,
          take: limit,
          select: {
            id: true,
            registrationId: true,
            certificateId: true,
            fullName: true,
            gender: true,
            status: true,
            createdAt: true,
            department: { select: { id: true, name: true } },
            faculty: { select: { id: true, name: true } },
            academicYear: { select: { id: true, academicYear: true } },
            _count: { select: { documents: true } }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.student.count()
      ]);

      console.timeEnd('⚡ Optimized Student List');
      console.log(`⚡ Fetched ${students.length} students`);

      return res.json({
        data: students,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * OPTIMIZED STUDENT VALIDATION (for frontend validation needs)
   * Returns all students with minimal fields for validation purposes
   */
  async getStudentValidation(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Student Validation Query');
      
      const students = await prisma.student.findMany({
        select: {
          id: true,
          registrationId: true,
          certificateId: true,
          fullName: true,
          departmentId: true,
          facultyId: true,
          academicYearId: true,
          status: true
        },
        orderBy: { registrationId: 'asc' }
      });

      console.timeEnd('⚡ Student Validation Query');
      console.log(`⚡ Fetched ${students.length} students for validation`);

      return res.json({
        data: students,
        total: students.length
      });

    } catch (error) {
      console.error('❌ Student validation error:', error);
      next(error);
    }
  }

  /**
   * OPTIMIZED STUDENT UPDATE
   * Target: Fast student update with cache invalidation
   */
  async updateStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      if (isNaN(studentId)) {
        throw new AppError('Invalid student ID', 400);
      }

      console.time('⚡ Student Update Performance');
      
      const validatedData = studentSchema.partial().parse(req.body);
      
      // Check if student exists
      const existingStudent = await prisma.student.findUnique({
        where: { id: studentId }
      });

      if (!existingStudent) {
        throw new AppError('Student not found', 404);
      }

      // Check for duplicates if updating registration ID or certificate ID
      if (validatedData.registrationId || validatedData.certificateId) {
        const duplicate = await prisma.student.findFirst({
          where: {
            AND: [
              { id: { not: studentId } },
              {
                OR: [
                  ...(validatedData.registrationId ? [{ registrationId: validatedData.registrationId }] : []),
                  ...(validatedData.certificateId ? [{ certificateId: validatedData.certificateId }] : [])
                ]
              }
            ]
          }
        });

        if (duplicate) {
          throw new AppError('Another student with the provided registration ID or certificate ID already exists', 400);
        }
      }

      // Update student with optimized query
      const student = await prisma.student.update({
        where: { id: studentId },
        data: validatedData,
        select: {
          id: true,
          registrationId: true,
          certificateId: true,
          fullName: true,
          gender: true,
          phone: true,
          gpa: true,
          grade: true,
          graduationDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          department: { select: { id: true, name: true, code: true } },
          faculty: { select: { id: true, name: true, code: true } },
          academicYear: { select: { id: true, academicYear: true } }
        }
      });

      // Invalidate cache for this student
      studentDetailsCache.delete(studentId);

      console.timeEnd('⚡ Student Update Performance');
      console.log(`⚡ Updated student ${student.registrationId}`);

      return res.json(student);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      console.error('❌ Student update error:', error);
      next(error);
    }
  }

  /**
   * CLEAR CACHE (for testing)
   */
  clearCache(): void {
    studentDetailsCache.clear();
    console.log('🗑️ Student details cache cleared');
  }
} 