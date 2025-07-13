"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedStudentController = void 0;
const prisma_1 = require("../lib/prisma");
const AppError_1 = require("../utils/AppError");
const AggressiveCacheService_1 = require("../services/AggressiveCacheService");
class CachedStudentController {
    async getStudentDetails(req, res, next) {
        try {
            const { id } = req.params;
            const studentId = parseInt(id);
            if (isNaN(studentId)) {
                throw new AppError_1.AppError('Invalid student ID', 400);
            }
            console.time('⚡ Ultra-Cached Student Details');
            const student = await AggressiveCacheService_1.aggressiveCache.get('students', `detail_${studentId}`, async () => {
                console.time('🔍 Fresh Student Detail Query');
                const [studentData, documents] = await Promise.all([
                    prisma_1.prisma.student.findUnique({
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
                    }),
                    prisma_1.prisma.document.findMany({
                        where: {
                            student: {
                                id: studentId
                            }
                        },
                        select: {
                            id: true,
                            documentType: true,
                            fileName: true,
                            fileSize: true,
                            fileType: true,
                            uploadDate: true,
                        },
                        orderBy: { uploadDate: 'desc' },
                        take: 20
                    })
                ]);
                console.timeEnd('🔍 Fresh Student Detail Query');
                if (!studentData) {
                    throw new AppError_1.AppError('Student not found', 404);
                }
                const result = {
                    ...studentData,
                    documents: documents || [],
                    documentsCount: (documents === null || documents === void 0 ? void 0 : documents.length) || 0
                };
                console.log(`⚡ Loaded student ${studentData.registrationId} with ${(documents === null || documents === void 0 ? void 0 : documents.length) || 0} documents (cached for future)`);
                return result;
            });
            console.timeEnd('⚡ Ultra-Cached Student Details');
            return res.json({
                data: student,
                cached: true,
                loadTime: 'optimized'
            });
        }
        catch (error) {
            console.error('❌ Cached student details error:', error);
            next(error);
        }
    }
    async getStudentBasic(req, res, next) {
        try {
            const { id } = req.params;
            const studentId = parseInt(id);
            console.time('⚡ Lightning Student Basic');
            const student = await AggressiveCacheService_1.aggressiveCache.get('students', `basic_${studentId}`, async () => {
                return await prisma_1.prisma.student.findUnique({
                    where: { id: studentId },
                    select: {
                        id: true,
                        registrationId: true,
                        certificateId: true,
                        fullName: true,
                        status: true,
                        department: { select: { name: true } },
                        faculty: { select: { name: true } },
                        _count: { select: { documents: true } }
                    }
                });
            });
            console.timeEnd('⚡ Lightning Student Basic');
            if (!student) {
                throw new AppError_1.AppError('Student not found', 404);
            }
            return res.json({ data: student });
        }
        catch (error) {
            next(error);
        }
    }
    async getStudentDocuments(req, res, next) {
        try {
            const { id } = req.params;
            const studentId = parseInt(id);
            console.time('⚡ Student Documents URLs');
            const student = await AggressiveCacheService_1.aggressiveCache.get('students', `basic_${studentId}`, async () => {
                return await prisma_1.prisma.student.findUnique({
                    where: { id: studentId },
                    select: { id: true, registrationId: true }
                });
            });
            if (!student) {
                throw new AppError_1.AppError('Student not found', 404);
            }
            const documents = await prisma_1.prisma.document.findMany({
                where: {
                    student: {
                        id: studentId
                    }
                },
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
            });
            console.timeEnd('⚡ Student Documents URLs');
            return res.json({
                data: documents,
                count: documents.length
            });
        }
        catch (error) {
            next(error);
        }
    }
    async invalidateStudentCache(studentId) {
        AggressiveCacheService_1.aggressiveCache.invalidate('students', `detail_${studentId}`);
        AggressiveCacheService_1.aggressiveCache.invalidate('students', `basic_${studentId}`);
        console.log(`🗑️ Invalidated cache for student ${studentId}`);
    }
    async clearStudentCache(req, res) {
        const { id } = req.params;
        if (id) {
            await this.invalidateStudentCache(parseInt(id));
            return res.json({
                success: true,
                message: `Cache cleared for student ${id}`
            });
        }
        else {
            AggressiveCacheService_1.aggressiveCache.invalidateCache('students');
            return res.json({
                success: true,
                message: 'All student cache cleared'
            });
        }
    }
}
exports.CachedStudentController = CachedStudentController;
//# sourceMappingURL=student.controller.cached.js.map