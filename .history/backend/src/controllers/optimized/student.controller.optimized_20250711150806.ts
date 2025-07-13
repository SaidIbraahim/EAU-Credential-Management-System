import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';

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

export class OptimizedStudentController {
  /**
   * OPTIMIZED: Get all students with selective field loading
   * Target: 913ms → 150-250ms (75% improvement)
   */
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      console.time('⚡ Optimized Student List Query');
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // OPTIMIZATION 1: Use selective fields instead of full includes
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
            phone: true,
            gpa: true,
            grade: true,
            graduationDate: true,
            status: true,
            createdAt: true,
            // SELECTIVE field loading for relations
            department: {
              select: { id: true, name: true, code: true }
            },
            faculty: {
              select: { id: true, name: true, code: true }
            },
            academicYear: {
              select: { id: true, academicYear: true }
            },
            // Count documents without loading them
            _count: {
              select: { documents: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        // Use count() instead of findMany for total
        prisma.student.count()
      ]);

      console.timeEnd('⚡ Optimized Student List Query');
      console.log(`⚡ Fetched ${students.length} students with optimized query`);

      return res.json({
        data: students,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      return res.status(500).json({ error: 'Failed to fetch students' });
    }
  }

  /**
   * OPTIMIZED: Get student by ID with minimal necessary data
   */
  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      console.time('⚡ Optimized Student Detail Query');
      
      const student = await prisma.student.findUnique({
        where: { id: parseInt(req.params.id) },
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
          department: {
            select: { id: true, name: true, code: true }
          },
          faculty: {
            select: { id: true, name: true, code: true }
          },
          academicYear: {
            select: { id: true, academicYear: true }
          },
          documents: {
            select: {
              id: true,
              documentType: true,
              fileName: true,
              fileSize: true,
              fileType: true,
              fileUrl: true,
              uploadDate: true
            },
            orderBy: { uploadDate: 'desc' }
          }
        }
      });

      console.timeEnd('⚡ Optimized Student Detail Query');

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      return res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      return res.status(500).json({ error: 'Failed to fetch student' });
    }
  }

  /**
   * OPTIMIZED: Search students with indexed fields
   */
  static async search(req: Request, res: Response): Promise<Response> {
    try {
      console.time('⚡ Optimized Student Search');
      
      const { query, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Use indexed search patterns
      const searchConditions = {
        OR: [
          { fullName: { contains: query as string, mode: 'insensitive' as const } },
          { registrationId: { contains: query as string, mode: 'insensitive' as const } },
          { certificateId: { contains: query as string, mode: 'insensitive' as const } }
        ]
      };

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where: searchConditions,
          select: {
            id: true,
            registrationId: true,
            certificateId: true,
            fullName: true,
            status: true,
            department: { select: { name: true } },
            faculty: { select: { name: true } },
            academicYear: { select: { academicYear: true } }
          },
          skip,
          take: Number(limit),
          orderBy: { fullName: 'asc' }
        }),
        prisma.student.count({ where: searchConditions })
      ]);

      console.timeEnd('⚡ Optimized Student Search');
      console.log(`⚡ Found ${students.length} students for query: "${query}"`);

      return res.json({
        data: students,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        query
      });
    } catch (error) {
      console.error('Error searching students:', error);
      return res.status(500).json({ error: 'Failed to search students' });
    }
  }

  /**
   * OPTIMIZED: Create student with minimal duplicate checking
   */
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      console.time('⚡ Optimized Student Creation');
      
      const validatedData = studentSchema.parse(req.body);
      
      // FAST duplicate check using indexed unique fields
      const existing = await prisma.student.findFirst({
        where: {
          OR: [
            { registrationId: validatedData.registrationId },
            ...(validatedData.certificateId ? [{ certificateId: validatedData.certificateId }] : [])
          ]
        },
        select: { id: true, registrationId: true }
      });

      if (existing) {
        return res.status(400).json({
          error: 'Student with this registration ID or certificate ID already exists'
        });
      }

      // Create with minimal relation loading
      const student = await prisma.student.create({
        data: validatedData,
        select: {
          id: true,
          registrationId: true,
          certificateId: true,
          fullName: true,
          status: true,
          department: { select: { name: true } },
          faculty: { select: { name: true } },
          academicYear: { select: { academicYear: true } }
        }
      });

      console.timeEnd('⚡ Optimized Student Creation');
      return res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating student:', error);
      return res.status(500).json({ error: 'Failed to create student' });
    }
  }

  /**
   * Get all students for validation with minimal fields
   */
  static async getAllForValidation(_req: Request, res: Response): Promise<Response> {
    try {
      console.time('⚡ Optimized Validation Query');
      
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
        orderBy: {
          registrationId: 'asc'
        }
      });

      console.timeEnd('⚡ Optimized Validation Query');
      console.log(`⚡ Fetched ${students.length} students for validation (minimal fields)`);

      return res.json({
        data: students,
        total: students.length
      });
    } catch (error) {
      console.error('Error fetching students for validation:', error);
      return res.status(500).json({ error: 'Failed to fetch students for validation' });
    }
  }
}

export default OptimizedStudentController; 