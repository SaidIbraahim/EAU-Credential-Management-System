import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';
import { DocumentType } from '../middleware/upload';

export class DocumentController {
  static async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, studentId, type } = req.query;
      
      const documents = await DocumentService.getDocuments(
        Number(page) || 1,
        Number(limit) || 10,
        {
          studentId: studentId ? Number(studentId) : undefined,
          type: type as DocumentType | undefined
        }
      );
      
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const documents = await DocumentService.getStudentDocuments(Number(studentId));
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }

  static async createDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, studentId } = req.body;
      const type = req.params.type as DocumentType;
      const files = req.files as Express.Multer.File[];

      const documents = await DocumentService.createDocuments({
        title,
        description,
        type,
        studentId: Number(studentId),
        files
      });

      res.status(201).json(documents);
    } catch (error) {
      next(error);
    }
  }

  static async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const document = await DocumentService.getDocumentById(Number(id));
      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  static async updateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description } = req.body;
      
      const document = await DocumentService.updateDocument(Number(id), {
        title,
        description
      });

      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  static async downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const document = await DocumentService.downloadDocument(Number(id));
      
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      
      res.sendFile(document.path);
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await DocumentService.deleteDocument(Number(id));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
} 