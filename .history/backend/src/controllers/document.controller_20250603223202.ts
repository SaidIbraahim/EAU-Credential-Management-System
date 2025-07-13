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
      
      // Use backend proxy method to stream files directly (bypasses R2 public access issues)
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { storageClient, STORAGE_BUCKET_NAME, extractKeyFromUrl } = await import('../config/storage');
      
      const storageKey = document.fileUrl.startsWith('documents/') 
        ? document.fileUrl 
        : extractKeyFromUrl(document.fileUrl);
      
      const getCommand = new GetObjectCommand({
        Bucket: STORAGE_BUCKET_NAME,
        Key: storageKey
      });
      
      const response = await storageClient.send(getCommand);
      
      if (!response.Body) {
        throw new AppError('File content not found', 404);
      }
      
      // Set response headers
      res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
      res.setHeader('Content-Length', response.ContentLength || 0);
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      
      // Stream the file content
      if (response.Body instanceof Uint8Array) {
        res.send(Buffer.from(response.Body));
      } else {
        // Handle stream
        const stream = response.Body as any;
        stream.pipe(res);
      }
      
    } catch (error) {
      console.error('Document download error:', error);
      next(error);
    }
  }

  // New route for direct file streaming/viewing
  static async streamDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const document = await documentService.getDocumentById(Number(id));
      
      if (!document) {
        throw new AppError('Document not found', 404);
      }
      
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { storageClient, STORAGE_BUCKET_NAME, extractKeyFromUrl } = await import('../config/storage');
      
      const storageKey = document.fileUrl.startsWith('documents/') 
        ? document.fileUrl 
        : extractKeyFromUrl(document.fileUrl);
      
      const getCommand = new GetObjectCommand({
        Bucket: STORAGE_BUCKET_NAME,
        Key: storageKey
      });
      
      const response = await storageClient.send(getCommand);
      
      if (!response.Body) {
        throw new AppError('File content not found', 404);
      }
      
      // Set response headers for direct viewing (no download prompt)
      res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
      res.setHeader('Content-Length', response.ContentLength || 0);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      
      // Stream the file content for direct viewing
      if (response.Body instanceof Uint8Array) {
        res.send(Buffer.from(response.Body));
      } else {
        // Handle stream
        const stream = response.Body as any;
        stream.pipe(res);
      }
      
    } catch (error) {
      console.error('Document stream error:', error);
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