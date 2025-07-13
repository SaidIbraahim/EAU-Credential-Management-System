import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';
import { AppError } from '../middleware/errorHandler';

const documentService = new DocumentService();

export class DocumentController {
  static async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query;
      
      const documents = await documentService.getAllDocuments(
        Number(page) || 1,
        Number(limit) || 10
      );
      
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { registrationId } = req.params;
      const documents = await documentService.getDocumentsByRegistrationId(registrationId);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }

  static async createDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { registrationId } = req.params;
      const documentType = req.params.documentType.toUpperCase(); // Convert to uppercase for database storage
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      // Find student by registration ID string
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const student = await prisma.student.findFirst({
        where: { registrationId: registrationId }
      });

      if (!student) {
        throw new AppError(`Student with registration ID '${registrationId}' not found`, 404);
      }

      // For now, handle single file upload - can be extended for multiple files
      const file = files[0];
      
      const document = await documentService.uploadDocument(file, {
        studentId: student.id, // Use student's numeric ID for foreign key
        registrationId: registrationId, // Keep original string registration ID for reference
        documentType,
        fileName: file.originalname,
        fileSize: file.size
      });

      res.status(201).json(document);
    } catch (error) {
      console.error('Document upload error:', error);
      next(error);
    }
  }

  static async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const document = await documentService.getDocumentById(Number(id));
      
      if (!document) {
        throw new AppError('Document not found', 404);
      }
      
      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  static async updateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { fileName, documentType } = req.body;
      
      const document = await documentService.updateDocument(Number(id), {
        fileName,
        documentType
      });

      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  static async downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const document = await documentService.getDocumentById(Number(id));
      
      if (!document) {
        throw new AppError('Document not found', 404);
      }
      
      // Generate presigned URL for secure access
      const { generatePresignedUrl, extractKeyFromUrl } = await import('../config/storage');
      const storageKey = extractKeyFromUrl(document.fileUrl);
      const presignedUrl = await generatePresignedUrl(storageKey, 3600); // 1 hour expiry
      
      // Return the presigned URL instead of redirecting
      res.json({ 
        url: presignedUrl,
        fileName: document.fileName,
        contentType: document.fileType || 'application/octet-stream',
        expiresIn: 3600
      });
    } catch (error) {
      console.error('Document download error:', error);
      next(error);
    }
  }

  static async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await documentService.deleteDocument(Number(id));
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
} 