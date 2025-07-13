import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { DocumentService } from '../services/document.service';

// Simple in-memory cache for verification results
const verificationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1 * 60 * 1000; // 1 minute for verification

export class OptimizedVerificationController {
  /**
   * OPTIMIZED: Verify a student by registration ID or certificate ID
   * Uses indexed unique fields and selective querying for maximum performance
   */
  static async verifyStudent(req: Request, res: Response) {
    try {
      const { identifier } = req.params;

      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: 'Identifier is required'
        });
      }

      // Check cache first
      const cacheKey = `verify_${identifier.trim().toUpperCase()}`;
      const cached = verificationCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('⚡ Verification served from cache');
        return res.json(cached.data);
      }

      console.time('⚡ OPTIMIZED Student Verification');
      
      let student = null;
      const normalizedIdentifier = identifier.trim().toUpperCase();

      try {
        // Check if identifier is a registration ID (starts with GRW-)
        if (normalizedIdentifier.startsWith('GRW-')) {
          console.log(`🔍 Looking up registration ID: ${normalizedIdentifier}`);
          
          // Use findUnique for O(1) indexed lookup - much faster than findFirst
          student = await prisma.student.findUnique({
            where: { 
              registrationId: normalizedIdentifier
            },
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
        } 
        // Check if identifier is numeric (certificate ID)
        else if (/^\d+$/.test(identifier)) {
          console.log(`🔍 Looking up certificate ID: ${identifier}`);
          
          // Use findUnique for O(1) indexed lookup
          student = await prisma.student.findUnique({
            where: { certificateId: identifier },
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
        }
        else {
          console.log(`❌ Invalid identifier format: ${identifier}`);
          return res.status(400).json({
            success: false,
            message: 'Invalid identifier format. Use registration ID (GRW-XXX-YYYY) or certificate number.'
          });
        }

      } catch (queryError) {
        console.error('❌ Database query error:', queryError);
        console.timeEnd('⚡ OPTIMIZED Student Verification');
        return res.status(500).json({
          success: false,
          message: 'Database error occurred during verification'
        });
      }

      console.timeEnd('⚡ OPTIMIZED Student Verification');

      if (!student) {
        console.log(`🔍 Student not found with identifier: ${identifier}`);
        
        // Cache negative result briefly to prevent repeated lookups
        const notFoundResult = {
          success: false,
          message: 'No student found with the provided identifier'
        };
        
        verificationCache.set(cacheKey, {
          data: notFoundResult,
          timestamp: Date.now()
        });

        return res.status(404).json(notFoundResult);
      }

      console.log(`✅ Student found: ${student.registrationId} (${student.fullName})`);

      // Generate presigned URLs for documents if student has registration ID
      let documents: any[] = [];
      if (student.registrationId) {
        try {
          console.time('⚡ Document URLs Generation');
          const documentService = new DocumentService();
          documents = await documentService.getDocumentsByRegistrationId(student.registrationId);
          console.timeEnd('⚡ Document URLs Generation');
          console.log(`📄 Generated URLs for ${documents.length} documents`);
        } catch (error: any) {
          console.warn('⚠️ Could not fetch documents with presigned URLs for verification:', error.message);
          // Continue without documents rather than failing
          documents = [];
        }
      }

      // Prepare optimized response
      const verificationResult = {
        success: true,
        student: {
          ...student,
          documents
        }
      };

      // Cache successful result
      verificationCache.set(cacheKey, {
        data: verificationResult,
        timestamp: Date.now()
      });

      console.log(`⚡ Verification completed for ${student.registrationId} - Performance optimized!`);

      return res.json(verificationResult);

    } catch (error) {
      console.error('❌ Verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while verifying the certificate'
      });
    }
  }

  /**
   * Clear verification cache (for testing or data updates)
   */
  static clearCache() {
    verificationCache.clear();
    console.log('🗑️ Verification cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      size: verificationCache.size,
      entries: Array.from(verificationCache.keys())
    };
  }
}

export default OptimizedVerificationController; 