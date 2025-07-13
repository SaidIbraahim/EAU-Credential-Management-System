import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const studentSchema = z.object({
  registrationId: z.string().regex(/^GRW-[A-Z]{3}-\d{4}$/),
  certificateId: z.string().regex(/^\d{4}$/).optional(),
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

export const StudentController = {
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const validatedData = studentSchema.parse(req.body);
      
      // Check for duplicate registration ID
      const existingStudent = await prisma.student.findFirst({
        where: {
          OR: [
            { registrationId: validatedData.registrationId },
            ...(validatedData.certificateId ? [{ certificateId: validatedData.certificateId }] : [])
          ]
        }
      });

      if (existingStudent) {
        return res.status(400).json({
          error: 'Student with this registration ID or certificate ID already exists'
        });
      }

      const student = await prisma.student.create({
        data: validatedData,
        include: {
          department: true,
          faculty: true,
          academicYear: true
        }
      });

      return res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating student:', error);
      return res.status(500).json({ error: 'Failed to create student' });
    }
  },

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          skip,
          take: limit,
          include: {
            department: true,
            faculty: true,
            academicYear: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.student.count()
      ]);

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
  },

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          department: true,
          faculty: true,
          academicYear: true,
          documents: true
        }
      });

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      return res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      return res.status(500).json({ error: 'Failed to fetch student' });
    }
  },

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const validatedData = studentSchema.partial().parse(req.body);
      
      // Check if the student exists
      const existingStudent = await prisma.student.findUnique({
        where: { id: parseInt(req.params.id) }
      });

      if (!existingStudent) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Check for duplicate IDs if they're being updated
      if (validatedData.registrationId || validatedData.certificateId) {
        const duplicate = await prisma.student.findFirst({
          where: {
            AND: [
              { id: { not: parseInt(req.params.id) } },
              {
                OR: [
                  validatedData.registrationId ? { registrationId: validatedData.registrationId } : {},
                  validatedData.certificateId ? { certificateId: validatedData.certificateId } : {}
                ]
              }
            ]
          }
        });

        if (duplicate) {
          return res.status(400).json({
            error: 'Another student with the provided registration ID or certificate ID already exists'
          });
        }
      }

      const student = await prisma.student.update({
        where: { id: parseInt(req.params.id) },
        data: validatedData,
        include: {
          department: true,
          faculty: true,
          academicYear: true
        }
      });

      return res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error updating student:', error);
      return res.status(500).json({ error: 'Failed to update student' });
    }
  },

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      await prisma.student.delete({
        where: { id: parseInt(req.params.id) }
      });

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting student:', error);
      return res.status(500).json({ error: 'Failed to delete student' });
    }
  },

  async bulkCreate(req: Request, res: Response): Promise<Response> {
    try {
      const students = z.array(studentSchema).parse(req.body.students);
      
      // Check for duplicate IDs in the incoming data
      const registrationIds = students.map(s => s.registrationId);
      const certificateIds = students.filter(s => s.certificateId).map(s => s.certificateId!);

      const existingStudents = await prisma.student.findMany({
        where: {
          OR: [
            { registrationId: { in: registrationIds } },
            ...(certificateIds.length > 0 ? [{ certificateId: { in: certificateIds } }] : [])
          ]
        }
      });

      if (existingStudents.length > 0) {
        return res.status(400).json({
          error: 'Some students already exist',
          conflictingIds: existingStudents.map(s => s.registrationId)
        });
      }

      const createdStudents = await prisma.student.createMany({
        data: students,
        skipDuplicates: true
      });

      return res.status(201).json({
        success: true,
        count: createdStudents.count,
        students: students
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error bulk creating students:', error);
      return res.status(500).json({ error: 'Failed to bulk create students' });
    }
  }
}; 