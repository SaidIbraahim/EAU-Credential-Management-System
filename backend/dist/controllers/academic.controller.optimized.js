"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedAcademicController = void 0;
const prisma_1 = require("../lib/prisma");
const academicCache = new Map();
const ACADEMIC_CACHE_TTL = 15 * 60 * 1000;
class OptimizedAcademicController {
    static clearAcademicCache() {
        academicCache.clear();
        console.log('🗑️ Backend academic cache cleared - new data will be fetched');
    }
    static clearSpecificCache(keys) {
        keys.forEach(key => {
            academicCache.delete(key);
            console.log(`🗑️ Backend cache cleared for key: ${key}`);
        });
    }
    async getAcademicYears(_req, res, next) {
        try {
            console.time('⚡ Optimized Academic Years');
            const cached = academicCache.get('academic_years');
            if (cached && Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL) {
                console.log('⚡ Academic years served from cache');
                console.timeEnd('⚡ Optimized Academic Years');
                return res.json(cached.data);
            }
            const academicYears = await prisma_1.prisma.academicYear.findMany({
                select: {
                    id: true,
                    academicYear: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });
            const result = { data: academicYears };
            academicCache.set('academic_years', {
                data: result,
                timestamp: Date.now()
            });
            console.log(`⚡ Fetched ${academicYears.length} academic years (cached)`);
            console.timeEnd('⚡ Optimized Academic Years');
            return res.json(result);
        }
        catch (error) {
            console.error('❌ Academic years error:', error);
            next(error);
        }
    }
    async getFaculties(_req, res, next) {
        try {
            console.time('⚡ Optimized Faculties');
            const cached = academicCache.get('faculties');
            if (cached && Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL) {
                console.log('⚡ Faculties served from cache');
                console.timeEnd('⚡ Optimized Faculties');
                return res.json(cached.data);
            }
            const faculties = await prisma_1.prisma.faculty.findMany({
                select: {
                    id: true,
                    name: true,
                    code: true,
                    description: true
                },
                orderBy: { name: 'asc' }
            });
            const result = { data: faculties };
            academicCache.set('faculties', {
                data: result,
                timestamp: Date.now()
            });
            console.log(`⚡ Fetched ${faculties.length} faculties (cached)`);
            console.timeEnd('⚡ Optimized Faculties');
            return res.json(result);
        }
        catch (error) {
            console.error('❌ Faculties error:', error);
            next(error);
        }
    }
    async getDepartments(_req, res, next) {
        try {
            console.time('⚡ Optimized Departments');
            const cached = academicCache.get('departments');
            if (cached && Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL) {
                console.log('⚡ Departments served from cache');
                console.timeEnd('⚡ Optimized Departments');
                return res.json(cached.data);
            }
            const departments = await prisma_1.prisma.department.findMany({
                select: {
                    id: true,
                    name: true,
                    code: true,
                    description: true,
                    facultyId: true,
                    faculty: {
                        select: { id: true, name: true, code: true }
                    }
                },
                orderBy: { name: 'asc' }
            });
            const result = { data: departments };
            academicCache.set('departments', {
                data: result,
                timestamp: Date.now()
            });
            console.log(`⚡ Fetched ${departments.length} departments (cached)`);
            console.timeEnd('⚡ Optimized Departments');
            return res.json(result);
        }
        catch (error) {
            console.error('❌ Departments error:', error);
            next(error);
        }
    }
    async getDepartmentsByFaculty(req, res, next) {
        try {
            const { facultyId } = req.params;
            const facultyIdNum = parseInt(facultyId);
            if (isNaN(facultyIdNum)) {
                return res.status(400).json({ error: 'Invalid faculty ID' });
            }
            console.time('⚡ Optimized Departments by Faculty');
            const cacheKey = `departments_faculty_${facultyIdNum}`;
            const cached = academicCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL) {
                console.log('⚡ Departments by faculty served from cache');
                console.timeEnd('⚡ Optimized Departments by Faculty');
                return res.json(cached.data);
            }
            const departments = await prisma_1.prisma.department.findMany({
                where: { facultyId: facultyIdNum },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    description: true,
                    facultyId: true
                },
                orderBy: { name: 'asc' }
            });
            const result = { data: departments };
            academicCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            console.log(`⚡ Fetched ${departments.length} departments for faculty ${facultyIdNum} (cached)`);
            console.timeEnd('⚡ Optimized Departments by Faculty');
            return res.json(result);
        }
        catch (error) {
            console.error('❌ Departments by faculty error:', error);
            next(error);
        }
    }
    clearAcademicCache(_req, res) {
        OptimizedAcademicController.clearAcademicCache();
        return res.json({
            message: 'Academic cache cleared',
            timestamp: new Date().toISOString()
        });
    }
    getCacheStats(_req, res) {
        const stats = {
            cacheSize: academicCache.size,
            cacheKeys: Array.from(academicCache.keys()),
            cacheTTL: ACADEMIC_CACHE_TTL,
            timestamp: new Date().toISOString()
        };
        return res.json(stats);
    }
}
exports.OptimizedAcademicController = OptimizedAcademicController;
//# sourceMappingURL=academic.controller.optimized.js.map