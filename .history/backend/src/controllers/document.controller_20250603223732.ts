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
      
      // Smart hybrid approach: choose method based on configuration and file characteristics
      const useProxy = DocumentController.shouldUseProxy(document);
      
      if (useProxy) {
        // Proxy method: Stream through backend (for security, small files, or when presigned URLs fail)
        await DocumentController.proxyDownload(document, res);
      } else {
        // Presigned URL method: Direct access (for large files, better performance)
        await DocumentController.presignedDownload(document, res);
      }
      
    } catch (error) {
      console.error('Document download error:', error);
      // Fallback to proxy if presigned URL fails
      if (!res.headersSent) {
        try {
          const document = await documentService.getDocumentById(Number(req.params.id));
          if (document) {
            await DocumentController.proxyDownload(document, res);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback download failed:', fallbackError);
        }
      }
      next(error);
    }
  }

  // Determine whether to use proxy or presigned URL based on smart criteria
  private static shouldUseProxy(document: any): boolean {
    // Configuration override
    if (process.env.CLOUD_STORAGE_FORCE_PROXY === 'true') return true;
    if (process.env.CLOUD_STORAGE_FORCE_PRESIGNED === 'true') return false;
    
    // File size considerations (proxy for smaller files, presigned for larger)
    const fileSizeThreshold = parseInt(process.env.PROXY_FILE_SIZE_THRESHOLD || '10485760'); // 10MB default
    if (document.fileSize && document.fileSize > fileSizeThreshold) {
      return false; // Use presigned URLs for large files
    }
    
    // Security considerations (proxy for sensitive document types)
    const sensitiveTypes = ['TRANSCRIPT', 'CERTIFICATE'];
    if (sensitiveTypes.includes(document.documentType)) {
      return true; // Use proxy for sensitive documents
    }
    
    // Default to proxy for better control
    return true;
  }

  // Presigned URL method
  private static async presignedDownload(document: any, res: Response): Promise<void> {
    const { generatePresignedUrl, extractKeyFromUrl } = await import('../config/storage');
    const storageKey = document.fileUrl.startsWith('documents/') 
      ? document.fileUrl 
      : extractKeyFromUrl(document.fileUrl);
    
    const presignedUrl = await generatePresignedUrl(storageKey, 3600); // 1 hour expiry
    
    // Return presigned URL for client-side download
    res.json({ 
      url: presignedUrl,
      fileName: document.fileName,
      contentType: document.fileType || 'application/octet-stream',
      expiresIn: 3600,
      method: 'presigned'
    });
  }

  // Proxy streaming method
  private static async proxyDownload(document: any, res: Response): Promise<void> {
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
    res.setHeader('X-Download-Method', 'proxy'); // Debug header
    
    // Stream the file content efficiently
    if (response.Body instanceof Uint8Array) {
      res.send(Buffer.from(response.Body));
    } else {
      // Handle stream with proper error handling
      const stream = response.Body as any;
      stream.on('error', (error: any) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error' });
        }
      });
      stream.pipe(res);
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