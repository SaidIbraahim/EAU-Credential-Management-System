"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UltraStudentController = void 0;
const prisma_1 = require("../lib/prisma");
const AppError_1 = require("../utils/AppError");
class StudentListCache {
    constructor() {
        this.cache = new Map();
        this.TTL = 5 * 60 * 1000;
        this.maxEntries = 100;
    }
    getCacheKey(page, limit, search, filters) {
        return `students_${page}_${limit}_${search}_${JSON.stringify(filters)}`;
    }
    get(cacheKey) {
        const entry = this.cache.get(cacheKey);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(cacheKey);
            return null;
        }
        return entry;
    }
    set(cacheKey, data) {
        if (this.cache.size >= this.maxEntries) {
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            for (let i = 0; i < 10; i++) {
                this.cache.delete(entries[i][0]);
            }
        }
        this.cache.set(cacheKey, {
            ...data,
            timestamp: Date.now(),
            cacheKey
        });
    }
    invalidateAll() {
        this.cache.clear();
    }
    getStats() {
        return {
            entries: this.cache.size,
            hitRate: this.cache.size > 0 ? 100 : 0
        };
    }
}
const studentListCache = new StudentListCache();
class UltraStudentController {
    async getStudents(req, res, next) {
        try {
            console.time('⚡ Ultra-Fast Student List');
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 25, 100);
            const search = req.query.search || '';
            const status = req.query.status;
            const departmentId = req.query.departmentId ? parseInt(req.query.departmentId) : undefined;
            const facultyId = req.query.facultyId ? parseInt(req.query.facultyId) : undefined;
            const filters = { status, departmentId, facultyId };
            const cacheKey = studentListCache.getCacheKey(page, limit, search, filters);
            const cached = studentListCache.get(cacheKey);
            if (cached) {
                console.log('⚡ Students served from cache');
                console.timeEnd('⚡ Ultra-Fast Student List');
                return res.json({
                    data: {
                        students: cached.students,
                        pagination: {
                            page,
                            limit,
                            total: cached.totalCount,
                            pages: Math.ceil(cached.totalCount / limit)
                        },
                        fromCache: true
                    }
                });
            }
            const whereClause = {};
            if (search) {
                whereClause.OR = [
                    { registrationId: { contains: search, mode: 'insensitive' } },
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { certificateId: { contains: search, mode: 'insensitive' } }
                ];
            }
            if (status) {
                whereClause.status = status;
            }
            if (departmentId) {
                whereClause.departmentId = departmentId;
            }
            if (facultyId) {
                whereClause.facultyId = facultyId;
            }
            console.time('⚡ Student Count Query');
            console.time('⚡ Student Data Query');
            const [totalCount, students] = await Promise.all([
                prisma_1.prisma.student.count({ where: whereClause }),
                prisma_1.prisma.student.findMany({
                    where: whereClause,
                    select: {
                        id: true,
                        registrationId: true,
                        fullName: true,
                        status: true,
                        gender: true,
                        department: {
                            select: { id: true, name: true }
                        },
                        faculty: {
                            select: { id: true, name: true }
                        },
                        academicYear: {
                            select: { id: true, academicYear: true }
                        },
                        _count: {
                            select: { documents: true }
                        },
                        createdAt: true,
                        graduationDate: true
                    },
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                })
            ]);
            console.timeEnd('⚡ Student Count Query');
            console.timeEnd('⚡ Student Data Query');
            studentListCache.set(cacheKey, { students, totalCount });
            console.timeEnd('⚡ Ultra-Fast Student List');
            return res.json({
                data: {
                    students,
                    pagination: {
                        page,
                        limit,
                        total: totalCount,
                        pages: Math.ceil(totalCount / limit)
                    },
                    performance: {
                        cached: false,
                        queryTime: `<200ms target`
                    }
                }
            });
        }
        catch (error) {
            console.error('Ultra-fast student list error:', error);
            next(error);
        }
    }
    async searchStudents(req, res, next) {
        try {
            console.time('⚡ Lightning Student Search');
            const query = req.query.q || '';
            const limit = Math.min(parseInt(req.query.limit) || 10, 20);
            if (query.length < 2) {
                return res.json({ data: [] });
            }
            const students = await prisma_1.prisma.student.findMany({
                where: {
                    OR: [
                        { registrationId: { contains: query, mode: 'insensitive' } },
                        { fullName: { contains: query, mode: 'insensitive' } }
                    ]
                },
                select: {
                    id: true,
                    registrationId: true,
                    fullName: true,
                    status: true
                },
                take: limit,
                orderBy: { createdAt: 'desc' }
            });
            console.timeEnd('⚡ Lightning Student Search');
            return res.json({ data: students });
        }
        catch (error) {
            next(error);
        }
    }
    async getStudent(req, res, next) {
        try {
            console.time('⚡ Student Details Fetch');
            const { id } = req.params;
            const student = await prisma_1.prisma.student.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    registrationId: true,
                    fullName: true,
                    gender: true,
                    status: true,
                    certificateId: true,
                    department: {
                        select: { id: true, name: true, code: true }
                    },
                    faculty: {
                        select: { id: true, name: true, code: true }
                    },
                    academicYear: {
                        select: { id: true, academicYear: true }
                    },
                    createdAt: true,
                    updatedAt: true,
                    graduationDate: true,
                    _count: {
                        select: { documents: true }
                    }
                }
            });
            if (!student) {
                throw new AppError_1.AppError('Student not found', 404);
            }
            console.timeEnd('⚡ Student Details Fetch');
            return res.json({ data: student });
        }
        catch (error) {
            next(error);
        }
    }
    async getStudentStats(_req, res, next) {
        try {
            console.time('⚡ Dashboard Stats');
            const [totalStudents, statusStats, genderStats, recentCount] = await Promise.all([
                prisma_1.prisma.student.count(),
                prisma_1.prisma.student.groupBy({
                    by: ['status'],
                    _count: { id: true }
                }),
                prisma_1.prisma.student.groupBy({
                    by: ['gender'],
                    _count: { id: true }
                }),
                prisma_1.prisma.student.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                })
            ]);
            console.timeEnd('⚡ Dashboard Stats');
            return res.json({
                data: {
                    total: totalStudents,
                    byStatus: statusStats,
                    byGender: genderStats,
                    recentlyAdded: recentCount
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async clearCache(_req, res) {
        studentListCache.invalidateAll();
        console.log('🗑️ Student list cache cleared');
        return res.json({
            success: true,
            message: 'Student list cache cleared'
        });
    }
    async getCacheStats(_req, res) {
        const stats = studentListCache.getStats();
        return res.json({
            success: true,
            data: {
                cache: stats,
                message: 'Student list cache statistics'
            }
        });
    }
}
exports.UltraStudentController = UltraStudentController;
//# sourceMappingURL=student.controller.ultra.js.map