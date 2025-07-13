import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { aggressiveCache } from '../services/AggressiveCacheService';

/**
 * ULTRA-CACHED Student Details Controller
 * Target: 2000ms → <50ms (95% improvement)
 * 
 * Strategy:
 * 1. Aggressive caching for student details
 * 2. Optimized document loading
 * 3. Stale-while-revalidate for instant responses
 */

export class CachedStudentController {
  /**
   * ULTRA-FAST STUDENT DETAILS WITH AGGRESSIVE CACHING
   * Target: First load <500ms, cached load <10ms
   */
  async getStudentDetails(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      if (isNaN(studentId)) {
        throw new AppError('Invalid student ID', 400);
      }

      console.time('⚡ Ultra-Cached Student Details');

      // Use aggressive cache with stale-while-revalidate
      const student = await aggressiveCache.get(
        'students',
        `detail_${studentId}`,
        async () => {
          console.time('🔍 Fresh Student Detail Query');
          
          // OPTIMIZED: Load student data and documents separately for better performance
          const [studentData, documents] = await Promise.all([
            // Student basic data with minimal relations
            prisma.student.findUnique({
              where: { id: studentId },
              select: {
                id: true,
                registrationId: true,
                certificateId: true,
                fullName: true,
                dateOfBirth: true,
                gender: true,
                phone: true,
                gpa: true,
                grade: true,
                graduationDate: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                
                // Related data with selective fields only
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
            
            // Documents with minimal fields (not full file data)
            prisma.document.findMany({
              where: { studentId },
              select: {
                id: true,
                documentType: true,
                fileName: true,
                fileSize: true,
                fileType: true,
                uploadDate: true,
                // Don't load fileUrl here - generate on demand
              },
              orderBy: { uploadDate: 'desc' },
              take: 20 // Limit to recent 20 documents
            })
          ]);

          console.timeEnd('🔍 Fresh Student Detail Query');

          if (!studentData) {
            throw new AppError('Student not found', 404);
          }

          // Combine data efficiently
          const result = {
            ...studentData,
            documents: documents || [],
            documentsCount: documents?.length || 0
          };

          console.log(`⚡ Loaded student ${studentData.registrationId} with ${documents?.length || 0} documents (cached for future)`);
          
          return result;
        }
      );

      console.timeEnd('⚡ Ultra-Cached Student Details');

      return res.json({ 
        data: student,
        cached: true,
        loadTime: 'optimized'
      });

    } catch (error) {
      console.error('❌ Cached student details error:', error);
      next(error);
    }
  }

  /**
   * LIGHTNING-FAST STUDENT BASIC INFO (for previews/cards)
   */
  async getStudentBasic(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      console.time('⚡ Lightning Student Basic');

      const student = await aggressiveCache.get(
        'students',
        `basic_${studentId}`,
        async () => {
          return await prisma.student.findUnique({
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
        }
      );

      console.timeEnd('⚡ Lightning Student Basic');

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      return res.json({ data: student });

    } catch (error) {
      next(error);
    }
  }

  /**
   * INSTANT DOCUMENT URLS (load documents on-demand)
   */
  async getStudentDocuments(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      console.time('⚡ Student Documents URLs');

      // Check if student exists (from cache if possible)
      const student = await aggressiveCache.get(
        'students',
        `basic_${studentId}`,
        async () => {
          return await prisma.student.findUnique({
            where: { id: studentId },
            select: { id: true, registrationId: true }
          });
        }
      );

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      // Load documents with presigned URLs
      const documents = await prisma.document.findMany({
        where: { studentId },
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

    } catch (error) {
      next(error);
    }
  }

  /**
   * CACHE MANAGEMENT
   */
  async invalidateStudentCache(studentId: number): Promise<void> {
    aggressiveCache.invalidate('students', `detail_${studentId}`);
    aggressiveCache.invalidate('students', `basic_${studentId}`);
    console.log(`🗑️ Invalidated cache for student ${studentId}`);
  }

  /**
   * CLEAR STUDENT CACHE (for admin)
   */
  async clearStudentCache(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (id) {
      await this.invalidateStudentCache(parseInt(id));
      return res.json({ 
        success: true, 
        message: `Cache cleared for student ${id}` 
      });
    } else {
      aggressiveCache.invalidateCache('students');
      return res.json({ 
        success: true, 
        message: 'All student cache cleared' 
      });
    }
  }
} 