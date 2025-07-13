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
   * STATIC CACHE CLEARING - Can be imported by other routes
   */
  static clearAcademicCache(): void {
    academicCache.clear();
    console.log('🗑️ Backend academic cache cleared - new data will be fetched');
  }

  /**
   * STATIC CACHE CLEARING WITH SPECIFIC KEYS - More granular control
   */
  static clearSpecificCache(keys: string[]): void {
    keys.forEach(key => {
      academicCache.delete(key);
      console.log(`🗑️ Backend cache cleared for key: ${key}`);
    });
  }

  /**
   * ULTRA-FAST ACADEMIC YEARS
   * Target: 3278ms → <200ms
   */
  async getAcademicYears(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
  async getFaculties(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Optimized Faculties');

      // Check cache first
      const cached = academicCache.get('faculties');
      if (cached && Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL) {
        console.log('⚡ Faculties served from cache');
        console.timeEnd('⚡ Optimized Faculties');
        return res.json(cached.data);
      }

      // Ultra-optimized query WITHOUT expensive _count operations
      const faculties = await prisma.faculty.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          description: true
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
  async getDepartments(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Optimized Departments');

      // Check cache first
      const cached = academicCache.get('departments');
      if (cached && Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL) {
        console.log('⚡ Departments served from cache');
        console.timeEnd('⚡ Optimized Departments');
        return res.json(cached.data);
      }

      // Ultra-optimized query with minimal fields (removed expensive _count)
      const departments = await prisma.department.findMany({
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
   * Target: <200ms
   */
  async getDepartmentsByFaculty(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { facultyId } = req.params;
      const facultyIdNum = parseInt(facultyId);

      if (isNaN(facultyIdNum)) {
        return res.status(400).json({ error: 'Invalid faculty ID' });
      }

      console.time('⚡ Optimized Departments by Faculty');

      // Check cache first
      const cacheKey = `departments_faculty_${facultyIdNum}`;
      const cached = academicCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ACADEMIC_CACHE_TTL) {
        console.log('⚡ Departments by faculty served from cache');
        console.timeEnd('⚡ Optimized Departments by Faculty');
        return res.json(cached.data);
      }

      // Ultra-optimized query with selective fields (removed expensive _count)
      const departments = await prisma.department.findMany({
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

      // Cache for 15 minutes
      academicCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`⚡ Fetched ${departments.length} departments for faculty ${facultyIdNum} (cached)`);
      console.timeEnd('⚡ Optimized Departments by Faculty');

      return res.json(result);

    } catch (error) {
      console.error('❌ Departments by faculty error:', error);
      next(error);
    }
  }

  /**
   * Clear academic cache (for testing)
   */
  clearAcademicCache(_req: Request, res: Response): Response {
    OptimizedAcademicController.clearAcademicCache();
    return res.json({ 
      message: 'Academic cache cleared',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(_req: Request, res: Response): Response {
    const stats = {
      cacheSize: academicCache.size,
      cacheKeys: Array.from(academicCache.keys()),
      cacheTTL: ACADEMIC_CACHE_TTL,
      timestamp: new Date().toISOString()
    };
    
    return res.json(stats);
  }
} 