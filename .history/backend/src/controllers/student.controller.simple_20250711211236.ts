import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

/**
 * SIMPLE OPTIMIZED Student Controller
 * Target: Fix 2000ms student details → <500ms
 * 
 * Strategy: Optimized queries without complex caching
 */

// Simple in-memory cache for student details
const studentDetailsCache = new Map<number, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class SimpleStudentController {
  
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
          
          // Documents with minimal data
          documents: {
            select: {
              id: true,
              documentType: true,
              fileName: true,
              fileSize: true,
              fileType: true,
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
   * CLEAR CACHE (for testing)
   */
  clearCache(): void {
    studentDetailsCache.clear();
    console.log('🗑️ Student details cache cleared');
  }
} 