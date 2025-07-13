"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = void 0;
const prisma_1 = require("../lib/prisma");
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
exports.StudentController = {
    async create(req, res) {
        try {
            console.time('⏱️ Student Creation Performance');
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
                return res.status(400).json({
                    error: 'Student with this registration ID or certificate ID already exists'
                });
            }
            const student = await prisma_1.prisma.student.create({
                data: validatedData,
                include: {
                    department: {
                        select: { id: true, name: true, code: true }
                    },
                    faculty: {
                        select: { id: true, name: true, code: true }
                    },
                    academicYear: {
                        select: { id: true, academicYear: true }
                    }
                }
            });
            console.timeEnd('⏱️ Student Creation Performance');
            return res.status(201).json(student);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.errors });
            }
            console.error('Error creating student:', error);
            return res.status(500).json({ error: 'Failed to create student' });
        }
    },
    async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const [students, total] = await Promise.all([
                prisma_1.prisma.student.findMany({
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
                prisma_1.prisma.student.count()
            ]);
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
    },
    async getAllForValidation(_req, res) {
        try {
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
            console.log(`📊 Fetched ${students.length} students for validation`);
            return res.json({
                data: students,
                total: students.length
            });
        }
        catch (error) {
            console.error('Error fetching students for validation:', error);
            return res.status(500).json({ error: 'Failed to fetch students for validation' });
        }
    },
    async getById(req, res) {
        try {
            const student = await prisma_1.prisma.student.findUnique({
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
        }
        catch (error) {
            console.error('Error fetching student:', error);
            return res.status(500).json({ error: 'Failed to fetch student' });
        }
    },
    async update(req, res) {
        try {
            const validatedData = studentSchema.partial().parse(req.body);
            const existingStudent = await prisma_1.prisma.student.findUnique({
                where: { id: parseInt(req.params.id) }
            });
            if (!existingStudent) {
                return res.status(404).json({ error: 'Student not found' });
            }
            if (validatedData.registrationId || validatedData.certificateId) {
                const duplicate = await prisma_1.prisma.student.findFirst({
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
            const student = await prisma_1.prisma.student.update({
                where: { id: parseInt(req.params.id) },
                data: validatedData,
                include: {
                    department: true,
                    faculty: true,
                    academicYear: true
                }
            });
            return res.json(student);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.errors });
            }
            console.error('Error updating student:', error);
            return res.status(500).json({ error: 'Failed to update student' });
        }
    },
    async delete(req, res) {
        try {
            await prisma_1.prisma.student.delete({
                where: { id: parseInt(req.params.id) }
            });
            return res.status(204).send();
        }
        catch (error) {
            console.error('Error deleting student:', error);
            return res.status(500).json({ error: 'Failed to delete student' });
        }
    },
    async bulkCreate(req, res) {
        var _a, _b;
        try {
            console.log('📥 Received bulk create request:', {
                body: req.body,
                studentsCount: (_a = req.body.students) === null || _a === void 0 ? void 0 : _a.length,
                firstStudent: (_b = req.body.students) === null || _b === void 0 ? void 0 : _b[0]
            });
            const students = zod_1.z.array(studentSchema).parse(req.body.students);
            const registrationIds = students.map(s => s.registrationId);
            const certificateIds = students.filter(s => s.certificateId).map(s => s.certificateId);
            const existingStudents = await prisma_1.prisma.student.findMany({
                where: {
                    OR: [
                        { registrationId: { in: registrationIds } },
                        ...(certificateIds.length > 0 ? [{ certificateId: { in: certificateIds } }] : [])
                    ]
                }
            });
            if (existingStudents.length > 0) {
                const duplicateDetails = existingStudents.map(s => ({
                    registrationId: s.registrationId,
                    certificateId: s.certificateId,
                    fullName: s.fullName
                }));
                console.log('🚨 Duplicate students found during bulk create:', duplicateDetails);
                return res.status(400).json({
                    error: 'Some students already exist in the database',
                    message: `Found ${existingStudents.length} duplicate student(s). Please remove duplicates and try again.`,
                    duplicateCount: existingStudents.length,
                    conflictingIds: existingStudents.map(s => s.registrationId),
                    duplicateDetails
                });
            }
            const createdStudents = await prisma_1.prisma.student.createMany({
                data: students,
                skipDuplicates: true
            });
            return res.status(201).json({
                success: true,
                count: createdStudents.count,
                students: students
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                console.error('Validation error:', error.errors);
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors,
                    message: 'Please check the data format and required fields'
                });
            }
            console.error('Error bulk creating students:', error);
            return res.status(500).json({ error: 'Failed to bulk create students' });
        }
    }
};
//# sourceMappingURL=student.controller.js.map