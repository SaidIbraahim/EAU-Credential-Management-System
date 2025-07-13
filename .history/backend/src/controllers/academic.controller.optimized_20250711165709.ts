import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * OPTIMIZED ACADEMIC DATA CONTROLLERS
 * Target: Fix 3000ms+ → <200ms for academic data
 * 
 * Problems identified in logs:
 * - Academic Years: 3278ms
 * - Faculties: 3351ms  
 * - Departments: 3618ms
 */

// Simple cache for academic data (rarely changes)
const academicCache = new Map<string, { data: any; timestamp: number }>();
const ACADEMIC_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for academic data

export class OptimizedAcademicController {

  /**
   * ULTRA-FAST ACADEMIC YEARS
   * Target: 3278ms → <200ms
   */
  async getAcademicYears(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Optimized Academic Years');

      // Check cache first
      const cached = academicCache.get('academic_years');
      if (cached && Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL) {
        console.log('⚡ Academic years served from cache');
        console.timeEnd('⚡ Optimized Academic Years');
        return res.json(cached.data);
      }

      // Optimized query with minimal fields
      const academicYears = await prisma.academicYear.findMany({
        select: {
          id: true,
          academicYear: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      const result = { data: academicYears };

      // Cache for 15 minutes
      academicCache.set('academic_years', {
        data: result,
        timestamp: Date.now()
      });

      console.log(`⚡ Fetched ${academicYears.length} academic years (cached)`);
      console.timeEnd('⚡ Optimized Academic Years');

      return res.json(result);

    } catch (error) {
      console.error('❌ Academic years error:', error);
      next(error);
    }
  }

  /**
   * ULTRA-FAST FACULTIES
   * Target: 3351ms → <200ms
   */
  async getFaculties(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Optimized Faculties');

      // Check cache first
      const cached = academicCache.get('faculties');
      if (cached && Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL) {
        console.log('⚡ Faculties served from cache');
        console.timeEnd('⚡ Optimized Faculties');
        return res.json(cached.data);
      }

      // Optimized query with minimal fields
      const faculties = await prisma.faculty.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { departments: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      const result = { data: faculties };

      // Cache for 15 minutes
      academicCache.set('faculties', {
        data: result,
        timestamp: Date.now()
      });

      console.log(`⚡ Fetched ${faculties.length} faculties (cached)`);
      console.timeEnd('⚡ Optimized Faculties');

      return res.json(result);

    } catch (error) {
      console.error('❌ Faculties error:', error);
      next(error);
    }
  }

  /**
   * ULTRA-FAST DEPARTMENTS
   * Target: 3618ms → <200ms
   */
  async getDepartments(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Optimized Departments');

      // Check cache first
      const cached = academicCache.get('departments');
      if (cached && Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL) {
        console.log('⚡ Departments served from cache');
        console.timeEnd('⚡ Optimized Departments');
        return res.json(cached.data);
      }

      // Optimized query with minimal fields
      const departments = await prisma.department.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          isActive: true,
          facultyId: true,
          createdAt: true,
          faculty: {
            select: { id: true, name: true, code: true }
          },
          _count: {
            select: { students: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      const result = { data: departments };

      // Cache for 15 minutes
      academicCache.set('departments', {
        data: result,
        timestamp: Date.now()
      });

      console.log(`⚡ Fetched ${departments.length} departments (cached)`);
      console.timeEnd('⚡ Optimized Departments');

      return res.json(result);

    } catch (error) {
      console.error('❌ Departments error:', error);
      next(error);
    }
  }

  /**
   * DEPARTMENTS BY FACULTY (optimized)
   */
  async getDepartmentsByFaculty(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { facultyId } = req.params;
      const fId = parseInt(facultyId);

      console.time('⚡ Departments by Faculty');

      // Check cache first
      const cacheKey = `departments_faculty_${fId}`;
      const cached = academicCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL) {
        console.log(`⚡ Departments for faculty ${fId} served from cache`);
        console.timeEnd('⚡ Departments by Faculty');
        return res.json(cached.data);
      }

      const departments = await prisma.department.findMany({
        where: { facultyId: fId },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          isActive: true,
          _count: {
            select: { students: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      const result = { data: departments };

      // Cache for 15 minutes
      academicCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.timeEnd('⚡ Departments by Faculty');
      return res.json(result);

    } catch (error) {
      next(error);
    }
  }

  /**
   * CLEAR ACADEMIC CACHE (for admin)
   */
  clearAcademicCache(req: Request, res: Response): Response {
    academicCache.clear();
    console.log('🗑️ Academic data cache cleared');
    
    return res.json({ 
      success: true, 
      message: 'Academic data cache cleared' 
    });
  }

  /**
   * GET CACHE STATS
   */
  getCacheStats(req: Request, res: Response): Response {
    const stats = {
      entries: academicCache.size,
      keys: Array.from(academicCache.keys()),
      totalMemory: academicCache.size * 1024 // Rough estimate
    };
    
    return res.json({ 
      success: true, 
      data: stats 
    });
  }
} 