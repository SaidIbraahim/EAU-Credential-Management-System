import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';
import { DocumentType, DOCUMENT_TYPES } from '../middleware/upload';
import { AppError } from '../middleware/errorHandler';

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

      if (!files || files.length === 0) {
        throw new AppError(400, 'No files uploaded');
      }

      if (files.length > DOCUMENT_TYPES[type].maxCount) {
        throw new AppError(400, `Maximum ${DOCUMENT_TYPES[type].maxCount} files allowed for ${type}`);
      }

      // Additional validation for file types
      const invalidFiles = files.filter(file => !DOCUMENT_TYPES[type].allowedTypes.includes(file.mimetype));
      if (invalidFiles.length > 0) {
        throw new AppError(400, `Invalid file type(s). Allowed types for ${type}: ${DOCUMENT_TYPES[type].extensions.join(', ')}`);
      }

      const documents = await DocumentService.createDocuments({
        title,
        description,
        type,
        studentId: Number(studentId),
        files
      });

      res.status(201).json(documents);
    } catch (error) {
      // Clean up uploaded files in case of error
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        await Promise.all(
          files.map(file => 
            import('fs/promises').then(fs => 
              fs.unlink(file.path).catch(() => {})
            )
          )
        );
      }
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