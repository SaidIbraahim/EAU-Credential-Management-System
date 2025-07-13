"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedStudentController = void 0;
const prisma_1 = require("../../lib/prisma");
const zod_1 = require("zod");
const studentSchema = zod_1.z.object({
    registrationId: zod_1.z.string().min(3),
    certificateId: zod_1.z.string().optional(),
    fullName: zod_1.z.string().min(2),
    gender: zod_1.z.enum(['MALE', 'FEMALE']).optional(),
    phone: zod_1.z.string().optional(),
    departmentId: zod_1.z.number(),
    facultyId: zod_1.z.number(),
    academicYearId: zod_1.z.number(),
    gpa: zod_1.z.number().min(0).max(4).optional(),
    grade: zod_1.z.string().optional(),
    graduationDate: zod_1.z.string().transform(str => new Date(str)).optional(),
    status: zod_1.z.enum(['CLEARED', 'UN_CLEARED']).default('UN_CLEARED')
});
class OptimizedStudentController {
    static async getAll(req, res) {
        try {
            console.time('⚡ Optimized Student List Query');
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const [students, total] = await Promise.all([
                prisma_1.prisma.student.findMany({
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
                        department: {
                            select: { id: true, name: true, code: true }
                        },
                        faculty: {
                            select: { id: true, name: true, code: true }
                        },
                        academicYear: {
                            select: { id: true, academicYear: true }
                        },
                        _count: {
                            select: { documents: true }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma_1.prisma.student.count()
            ]);
            console.timeEnd('⚡ Optimized Student List Query');
            console.log(`⚡ Fetched ${students.length} students with optimized query`);
            return res.json({
                data: students,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        }
        catch (error) {
            console.error('Error fetching students:', error);
            return res.status(500).json({ error: 'Failed to fetch students' });
        }
    }
    static async getById(req, res) {
        try {
            console.time('⚡ Optimized Student Detail Query');
            const student = await prisma_1.prisma.student.findUnique({
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
        }
        catch (error) {
            console.error('Error fetching student:', error);
            return res.status(500).json({ error: 'Failed to fetch student' });
        }
    }
    static async search(req, res) {
        try {
            console.time('⚡ Optimized Student Search');
            const { query, page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            if (!query || typeof query !== 'string') {
                return res.status(400).json({ error: 'Search query is required' });
            }
            const searchConditions = {
                OR: [
                    { fullName: { contains: query, mode: 'insensitive' } },
                    { registrationId: { contains: query, mode: 'insensitive' } },
                    { certificateId: { contains: query, mode: 'insensitive' } }
                ]
            };
            const [students, total] = await Promise.all([
                prisma_1.prisma.student.findMany({
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
                prisma_1.prisma.student.count({ where: searchConditions })
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
        }
        catch (error) {
            console.error('Error searching students:', error);
            return res.status(500).json({ error: 'Failed to search students' });
        }
    }
    static async create(req, res) {
        try {
            console.time('⚡ Optimized Student Creation');
            const validatedData = studentSchema.parse(req.body);
            const existing = await prisma_1.prisma.student.findFirst({
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
            const student = await prisma_1.prisma.student.create({
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.errors });
            }
            console.error('Error creating student:', error);
            return res.status(500).json({ error: 'Failed to create student' });
        }
    }
    static async getAllForValidation(_req, res) {
        try {
            console.time('⚡ Optimized Validation Query');
            const students = await prisma_1.prisma.student.findMany({
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
        }
        catch (error) {
            console.error('Error fetching students for validation:', error);
            return res.status(500).json({ error: 'Failed to fetch students for validation' });
        }
    }
}
exports.OptimizedStudentController = OptimizedStudentController;
exports.default = OptimizedStudentController;
//# sourceMappingURL=student.controller.optimized.js.map