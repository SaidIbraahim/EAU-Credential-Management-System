"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryOptimizer = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000;
class QueryOptimizer {
    static async getStudents(params = {}) {
        const { page = 1, limit = 20, search, departmentId, status } = params;
        const offset = (page - 1) * limit;
        console.time('⚡ Optimized Student Query');
        try {
            const whereConditions = {};
            if (search) {
                whereConditions.OR = [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { registrationId: { contains: search, mode: 'insensitive' } },
                    { certificateId: { contains: search, mode: 'insensitive' } }
                ];
            }
            if (departmentId) {
                whereConditions.departmentId = departmentId;
            }
            if (status) {
                whereConditions.status = status;
            }
            const [students, totalCount] = await Promise.all([
                prisma.student.findMany({
                    where: whereConditions,
                    include: {
                        department: { select: { name: true } },
                        faculty: { select: { name: true } },
                        academicYear: { select: { academicYear: true } },
                        _count: { select: { documents: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: offset,
                    take: limit,
                }),
                prisma.student.count({ where: whereConditions })
            ]);
            console.timeEnd('⚡ Optimized Student Query');
            console.log(`⚡ Retrieved ${students.length} students in optimized query`);
            return {
                students,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page
            };
        }
        catch (error) {
            console.error('❌ Optimized student query failed:', error);
            throw error;
        }
    }
    static async getStudentById(id) {
        console.time('⚡ Optimized Student Detail Query');
        try {
            const student = await prisma.student.findUnique({
                where: { id },
                include: {
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
            if (student) {
                console.log(`⚡ Retrieved student ${student.registrationId} with ${student.documents.length} documents`);
            }
            return student;
        }
        catch (error) {
            console.error('❌ Optimized student detail query failed:', error);
            throw error;
        }
    }
    static async getUserById(id) {
        const cacheKey = `user_${id}`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('⚡ User served from cache');
            return cached.data;
        }
        console.time('⚡ Optimized User Query');
        try {
            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    isActive: true,
                    lastLogin: true,
                    createdAt: true
                }
            });
            if (user) {
                cache.set(cacheKey, { data: user, timestamp: Date.now() });
            }
            console.timeEnd('⚡ Optimized User Query');
            return user;
        }
        catch (error) {
            console.error('❌ Optimized user query failed:', error);
            throw error;
        }
    }
    static async getDepartments() {
        const cacheKey = 'departments_with_counts';
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('⚡ Departments served from cache');
            return cached.data;
        }
        console.time('⚡ Optimized Department Query');
        try {
            const departments = await prisma.$queryRaw `
        SELECT 
          d.id,
          d.name,
          d.code,
          d.description,
          f.name as faculty_name,
          f.id as faculty_id,
          COUNT(s.id)::int as student_count
        FROM departments d
        LEFT JOIN faculties f ON d.faculty_id = f.id
        LEFT JOIN students s ON d.id = s.department_id
        GROUP BY d.id, d.name, d.code, d.description, f.name, f.id
        ORDER BY d.name ASC
      `;
            cache.set(cacheKey, { data: departments, timestamp: Date.now() });
            console.timeEnd('⚡ Optimized Department Query');
            return departments;
        }
        catch (error) {
            console.error('❌ Optimized department query failed:', error);
            throw error;
        }
    }
    static async getAcademicYears() {
        const cacheKey = 'academic_years_with_counts';
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('⚡ Academic years served from cache');
            return cached.data;
        }
        console.time('⚡ Optimized Academic Year Query');
        try {
            const academicYears = await prisma.$queryRaw `
        SELECT 
          ay.id,
          ay.academic_year,
          ay.is_active,
          COUNT(s.id)::int as student_count
        FROM academic_years ay
        LEFT JOIN students s ON ay.id = s.academic_year_id
        GROUP BY ay.id, ay.academic_year, ay.is_active
        ORDER BY ay.academic_year DESC
      `;
            cache.set(cacheKey, { data: academicYears, timestamp: Date.now() });
            console.timeEnd('⚡ Optimized Academic Year Query');
            return academicYears;
        }
        catch (error) {
            console.error('❌ Optimized academic year query failed:', error);
            throw error;
        }
    }
    static async getAuditLogs(params = {}) {
        const { page = 1, limit = 20, userId, action, startDate, endDate } = params;
        const offset = (page - 1) * limit;
        console.time('⚡ Optimized Audit Log Query');
        try {
            const whereConditions = {};
            if (userId)
                whereConditions.userId = userId;
            if (action)
                whereConditions.action = action;
            if (startDate || endDate) {
                whereConditions.timestamp = {};
                if (startDate)
                    whereConditions.timestamp.gte = startDate;
                if (endDate)
                    whereConditions.timestamp.lte = endDate;
            }
            const [logs, totalCount] = await Promise.all([
                prisma.auditLog.findMany({
                    where: whereConditions,
                    include: {
                        user: {
                            select: { username: true, email: true }
                        }
                    },
                    orderBy: { timestamp: 'desc' },
                    skip: offset,
                    take: limit
                }),
                prisma.auditLog.count({ where: whereConditions })
            ]);
            console.timeEnd('⚡ Optimized Audit Log Query');
            console.log(`⚡ Retrieved ${logs.length} audit logs in optimized query`);
            return {
                logs,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page
            };
        }
        catch (error) {
            console.error('❌ Optimized audit log query failed:', error);
            throw error;
        }
    }
    static clearCache(pattern) {
        if (pattern) {
            for (const key of cache.keys()) {
                if (key.includes(pattern)) {
                    cache.delete(key);
                }
            }
        }
        else {
            cache.clear();
        }
        console.log('🗑️ Cache cleared');
    }
    static getCacheStats() {
        return {
            size: cache.size,
            keys: Array.from(cache.keys())
        };
    }
}
exports.QueryOptimizer = QueryOptimizer;
exports.default = QueryOptimizer;
//# sourceMappingURL=queryOptimizer.js.map