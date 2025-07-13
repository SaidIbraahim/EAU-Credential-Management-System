"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const client_1 = require("@prisma/client");
const cache_1 = require("../utils/cache");
const prisma = new client_1.PrismaClient();
class ReportingService {
    static async getDashboardStats() {
        const cacheKey = 'dashboard-stats';
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            console.log('📊 Dashboard stats served from cache');
            return cached;
        }
        console.time('🔥 Dashboard Stats Generation');
        try {
            const [totalStudents, studentsByStatus, totalDocuments, departmentStats, facultyStats, monthlyRegistrations, recentActivity] = await Promise.all([
                prisma.student.count(),
                prisma.student.groupBy({
                    by: ['status'],
                    _count: true
                }),
                prisma.document.count(),
                prisma.student.groupBy({
                    by: ['departmentId'],
                    _count: true,
                    include: {
                        department: {
                            select: { name: true }
                        }
                    }
                }),
                prisma.student.groupBy({
                    by: ['facultyId'],
                    _count: true,
                    include: {
                        faculty: {
                            select: { name: true }
                        }
                    }
                }),
                prisma.$queryRaw `
          SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            COUNT(*)::integer as count
          FROM students 
          WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY TO_CHAR(created_at, 'YYYY-MM')
          ORDER BY month DESC
          LIMIT 12
        `,
                prisma.auditLog.groupBy({
                    by: ['action'],
                    _count: true,
                    where: {
                        timestamp: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    },
                    orderBy: {
                        _count: {
                            action: 'desc'
                        }
                    },
                    take: 10
                })
            ]);
            const statusMap = studentsByStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
            }, {});
            const stats = {
                totalStudents,
                clearedStudents: statusMap['CLEARED'] || 0,
                unclearedStudents: statusMap['UN_CLEARED'] || 0,
                totalDocuments,
                departmentStats: await this.enrichDepartmentStats(departmentStats),
                facultyStats: await this.enrichFacultyStats(facultyStats),
                monthlyRegistrations: monthlyRegistrations,
                recentActivity: recentActivity.map(item => ({
                    action: item.action,
                    count: item._count,
                    timestamp: new Date()
                }))
            };
            await cache_1.cache.set(cacheKey, stats, 300);
            console.timeEnd('🔥 Dashboard Stats Generation');
            console.log(`📊 Generated dashboard stats: ${totalStudents} students, ${totalDocuments} documents`);
            return stats;
        }
        catch (error) {
            console.error('❌ Error generating dashboard stats:', error);
            throw new Error('Failed to generate dashboard statistics');
        }
    }
    static async searchStudents(filters) {
        console.time('🔍 Student Search');
        const { search, status, departmentId, facultyId, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { registrationId: { contains: search, mode: 'insensitive' } },
                { certificateId: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (status)
            where.status = status;
        if (departmentId)
            where.departmentId = departmentId;
        if (facultyId)
            where.facultyId = facultyId;
        try {
            const [students, total] = await Promise.all([
                prisma.student.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        registrationId: true,
                        certificateId: true,
                        fullName: true,
                        status: true,
                        createdAt: true,
                        department: {
                            select: { name: true, code: true }
                        },
                        faculty: {
                            select: { name: true, code: true }
                        },
                        academicYear: {
                            select: { academicYear: true }
                        },
                        _count: {
                            select: { documents: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.student.count({ where })
            ]);
            console.timeEnd('🔍 Student Search');
            return {
                students,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            };
        }
        catch (error) {
            console.error('❌ Student search error:', error);
            throw new Error('Failed to search students');
        }
    }
    static async enrichDepartmentStats(departmentStats) {
        const departmentIds = departmentStats.map(stat => stat.departmentId);
        const departments = await prisma.department.findMany({
            where: { id: { in: departmentIds } },
            select: { id: true, name: true }
        });
        const departmentMap = departments.reduce((acc, dept) => {
            acc[dept.id] = dept.name;
            return acc;
        }, {});
        return departmentStats.map(stat => ({
            name: departmentMap[stat.departmentId] || 'Unknown',
            count: stat._count,
            clearedCount: 0
        }));
    }
    static async enrichFacultyStats(facultyStats) {
        const facultyIds = facultyStats.map(stat => stat.facultyId);
        const faculties = await prisma.faculty.findMany({
            where: { id: { in: facultyIds } },
            select: { id: true, name: true }
        });
        const facultyMap = faculties.reduce((acc, faculty) => {
            acc[faculty.id] = faculty.name;
            return acc;
        }, {});
        return facultyStats.map(stat => ({
            name: facultyMap[stat.facultyId] || 'Unknown',
            count: stat._count,
            clearedCount: 0
        }));
    }
    static async invalidateCache() {
        await cache_1.cache.delete('dashboard-stats');
        console.log('🗑️ Reporting cache invalidated');
    }
}
exports.ReportingService = ReportingService;
//# sourceMappingURL=reporting.service.js.map