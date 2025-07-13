"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleStudentController = void 0;
const prisma_1 = require("../lib/prisma");
const AppError_1 = require("../utils/AppError");
const zod_1 = require("zod");
const studentDetailsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
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
class SimpleStudentController {
    async createStudent(req, res, next) {
        try {
            console.time('⚡ Student Creation Performance');
            const validatedData = studentSchema.parse(req.body);
            const existingStudent = await prisma_1.prisma.student.findFirst({
                where: {
                    OR: [
                        { registrationId: validatedData.registrationId },
                        ...(validatedData.certificateId ? [{ certificateId: validatedData.certificateId }] : [])
                    ]
                },
                select: { id: true, registrationId: true }
            });
            if (existingStudent) {
                throw new AppError_1.AppError('Student with this registration ID or certificate ID already exists', 400);
            }
            const student = await prisma_1.prisma.student.create({
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors
                });
            }
            console.error('❌ Student creation error:', error);
            next(error);
        }
    }
    async bulkCreateStudents(req, res, next) {
        try {
            console.time('⚡ Bulk Student Creation');
            const students = zod_1.z.array(studentSchema).parse(req.body.students);
            const registrationIds = students.map(s => s.registrationId);
            const certificateIds = students.filter(s => s.certificateId).map(s => s.certificateId);
            const existingStudents = await prisma_1.prisma.student.findMany({
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
            const createdStudents = await prisma_1.prisma.student.createMany({
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
    async getStudentDetails(req, res, next) {
        try {
            const { id } = req.params;
            const studentId = parseInt(id);
            if (isNaN(studentId)) {
                throw new AppError_1.AppError('Invalid student ID', 400);
            }
            console.time('⚡ Simple Student Details');
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
            const student = await prisma_1.prisma.student.findUnique({
                where: { id: studentId },
                select: {
                    id: true,
                    registrationId: true,
                    certificateId: true,
                    fullName: true,
                    gender: true,
                    phone: true,
                    departmentId: true,
                    facultyId: true,
                    academicYearId: true,
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
                        orderBy: { uploadDate: 'desc' },
                        take: 10
                    }
                }
            });
            console.timeEnd('🔍 Optimized Student Query');
            if (!student) {
                throw new AppError_1.AppError('Student not found', 404);
            }
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
        }
        catch (error) {
            console.error('❌ Student details error:', error);
            next(error);
        }
    }
    async getStudentList(req, res, next) {
        try {
            console.time('⚡ Optimized Student List');
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
                        status: true,
                        createdAt: true,
                        department: { select: { id: true, name: true } },
                        faculty: { select: { id: true, name: true } },
                        academicYear: { select: { id: true, academicYear: true } },
                        _count: { select: { documents: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma_1.prisma.student.count()
            ]);
            console.timeEnd('⚡ Optimized Student List');
            console.log(`⚡ Fetched ${students.length} students`);
            return res.json({
                data: students,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getStudentValidation(_req, res, next) {
        try {
            console.time('⚡ Student Validation Query');
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
                orderBy: { registrationId: 'asc' }
            });
            console.timeEnd('⚡ Student Validation Query');
            console.log(`⚡ Fetched ${students.length} students for validation`);
            return res.json({
                data: students,
                total: students.length
            });
        }
        catch (error) {
            console.error('❌ Student validation error:', error);
            next(error);
        }
    }
    async updateStudent(req, res, next) {
        try {
            const { id } = req.params;
            const studentId = parseInt(id);
            if (isNaN(studentId)) {
                throw new AppError_1.AppError('Invalid student ID', 400);
            }
            console.time('⚡ Ultra-Fast Student Update');
            const validatedData = studentSchema.partial().parse(req.body);
            const checks = await Promise.all([
                prisma_1.prisma.student.findUnique({
                    where: { id: studentId },
                    select: { id: true, registrationId: true }
                }),
                (validatedData.registrationId || validatedData.certificateId) ?
                    prisma_1.prisma.student.findFirst({
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
                        },
                        select: { id: true }
                    }) : null
            ]);
            const [existingStudent, duplicate] = checks;
            if (!existingStudent) {
                throw new AppError_1.AppError('Student not found', 404);
            }
            if (duplicate) {
                throw new AppError_1.AppError('Another student with the provided registration ID or certificate ID already exists', 400);
            }
            const student = await prisma_1.prisma.student.update({
                where: { id: studentId },
                data: validatedData,
                select: {
                    id: true,
                    registrationId: true,
                    certificateId: true,
                    fullName: true,
                    gender: true,
                    phone: true,
                    departmentId: true,
                    facultyId: true,
                    academicYearId: true,
                    gpa: true,
                    grade: true,
                    graduationDate: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            const [department, faculty, academicYear] = await Promise.all([
                student.departmentId ? prisma_1.prisma.department.findUnique({
                    where: { id: student.departmentId },
                    select: { id: true, name: true, code: true }
                }) : null,
                student.facultyId ? prisma_1.prisma.faculty.findUnique({
                    where: { id: student.facultyId },
                    select: { id: true, name: true, code: true }
                }) : null,
                student.academicYearId ? prisma_1.prisma.academicYear.findUnique({
                    where: { id: student.academicYearId },
                    select: { id: true, academicYear: true }
                }) : null
            ]);
            const response = {
                ...student,
                department: department || null,
                faculty: faculty || null,
                academicYear: academicYear || null
            };
            studentDetailsCache.delete(studentId);
            console.timeEnd('⚡ Ultra-Fast Student Update');
            console.log(`⚡ Updated student ${student.registrationId} (ULTRA-FAST)`);
            return res.json({
                data: response,
                cached: false,
                optimized: true
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors
                });
            }
            console.error('❌ Student update error:', error);
            next(error);
        }
    }
    async deleteStudent(req, res, next) {
        try {
            const { id } = req.params;
            const studentId = parseInt(id);
            if (isNaN(studentId)) {
                throw new AppError_1.AppError('Invalid student ID', 400);
            }
            console.time('⚡ Student Delete Performance');
            const existingStudent = await prisma_1.prisma.student.findUnique({
                where: { id: studentId }
            });
            if (!existingStudent) {
                throw new AppError_1.AppError('Student not found', 404);
            }
            await prisma_1.prisma.student.delete({
                where: { id: studentId }
            });
            studentDetailsCache.delete(studentId);
            console.timeEnd('⚡ Student Delete Performance');
            console.log(`⚡ Deleted student ${existingStudent.registrationId}`);
            return res.json({
                message: 'Student deleted successfully',
                deletedStudent: {
                    id: existingStudent.id,
                    registrationId: existingStudent.registrationId,
                    fullName: existingStudent.fullName
                }
            });
        }
        catch (error) {
            console.error('❌ Student delete error:', error);
            next(error);
        }
    }
    clearCache() {
        studentDetailsCache.clear();
        console.log('🗑️ Student details cache cleared');
    }
}
exports.SimpleStudentController = SimpleStudentController;
//# sourceMappingURL=student.controller.simple.js.map