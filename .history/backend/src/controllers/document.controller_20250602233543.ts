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
      const documentType = req.params.documentType;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      // For now, handle single file upload - can be extended for multiple files
      const file = files[0];
      
      // Find student to get the ID
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const student = await prisma.student.findFirst({
        where: { registrationId: registrationId }
      });

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      const document = await documentService.uploadDocument(file, {
        registrationId: student.id, // Use student's numeric ID
        documentType,
        fileName: file.originalname,
        fileSize: file.size
      });

      res.status(201).json(document);
    } catch (error) {
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
      
      // Redirect to the cloud storage URL
      res.redirect(document.fileUrl);
    } catch (error) {
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