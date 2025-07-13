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
      console.time('⚡ Document Upload Performance');
      
      const { registrationId } = req.params;
      const documentType = req.params.documentType.toUpperCase(); // Convert to uppercase for database storage
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      console.log(`📤 Starting ${files.length} file upload(s) for ${registrationId} (${documentType})`);

      // Find student by registration ID string
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const student = await prisma.student.findFirst({
        where: { registrationId: registrationId },
        select: { id: true, registrationId: true } // Only select needed fields
      });

      if (!student) {
        throw new AppError(`Student with registration ID '${registrationId}' not found`, 404);
      }

      // ⚡ Use parallel upload service for multiple files
      if (files.length > 1) {
        const documents = await documentService.uploadDocumentsParallel(
          files,
          student.id,
          registrationId,
          documentType
        );
        
        console.timeEnd('⚡ Document Upload Performance');
        console.log(`🚀 Parallel upload completed: ${files.length} files for ${registrationId}`);
        
        res.status(201).json({
          success: true,
          count: documents.length,
          documents: documents.map(doc => ({
            id: doc.id,
            fileName: doc.fileName,
            documentType: doc.documentType,
            fileSize: doc.fileSize,
            uploadDate: doc.uploadDate
          }))
        });
      } else {
        // Single file upload (existing logic)
        const file = files[0];
        
        const document = await documentService.uploadDocument(file, {
          studentId: student.id,
          registrationId: registrationId,
          documentType,
          fileName: file.originalname,
          fileSize: file.size
        });

        console.timeEnd('⚡ Document Upload Performance');
        res.status(201).json(document);
      }
    } catch (error) {
      console.error('Document upload error:', error);
      next(error);
    }
  }

  static async bulkUploadDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      const { organizationData } = req.body;

      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      console.log('📥 Bulk upload request:', {
        filesCount: files.length,
        organizationData: organizationData ? 'provided' : 'missing',
        fileNames: files.map(f => f.originalname || 'no-name'),
        fileSizes: files.map(f => f.size)
      });

      let organizedFiles: {[registrationId: string]: {[docType: string]: Express.Multer.File[]}} = {};
      
      // Use organizationData from frontend if provided (contains proper document type mapping)
      if (organizationData) {
        try {
          const parsedOrgData = typeof organizationData === 'string' 
            ? JSON.parse(organizationData) 
            : organizationData;
          
          console.log('📋 Using organization data:', parsedOrgData);
          
          // Map files to their proper organization structure
          for (const file of files) {
            const fileName = file.originalname || (file as any).name || 'unknown';
            
            // Find this file in the organization data
            let found = false;
            for (const [registrationId, studentDocs] of Object.entries(parsedOrgData)) {
              for (const [docType, docFiles] of Object.entries(studentDocs as any)) {
                const fileList = docFiles as any[];
                for (const orgFile of fileList) {
                  if (orgFile.name === fileName || fileName.includes(registrationId)) {
                    if (!organizedFiles[registrationId]) {
                      organizedFiles[registrationId] = {};
                    }
                    if (!organizedFiles[registrationId][docType]) {
                      organizedFiles[registrationId][docType] = [];
                    }
                    organizedFiles[registrationId][docType].push(file);
                    found = true;
                    break;
                  }
                }
                if (found) break;
              }
              if (found) break;
            }
            
            // Fallback: try to extract info from filename
            if (!found) {
              console.log(`⚠️ File not found in organization data, using fallback: ${fileName}`);
              const fileNameWithoutExt = fileName.split('.')[0];
              const registrationId = fileNameWithoutExt;
              const docType = 'supporting'; // fallback
              
              if (!organizedFiles[registrationId]) {
                organizedFiles[registrationId] = {};
              }
              if (!organizedFiles[registrationId][docType]) {
                organizedFiles[registrationId][docType] = [];
              }
              organizedFiles[registrationId][docType].push(file);
            }
          }
        } catch (parseError) {
          console.error('Error parsing organization data:', parseError);
          // Fallback to original logic
          organizedFiles = DocumentController.fallbackFileOrganization(files);
        }
      } else {
        // Fallback to original logic if no organization data
        organizedFiles = DocumentController.fallbackFileOrganization(files);
      }

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const results: any[] = [];
      const errors: string[] = [];
      let totalProcessed = 0;
      let totalSuccessful = 0;

      // Process each student's documents
      for (const [registrationId, studentDocs] of Object.entries(organizedFiles)) {
        try {
          // Find student by registration ID
          const student = await prisma.student.findFirst({
            where: { registrationId: registrationId }
          });

          if (!student) {
            errors.push(`Student with registration ID '${registrationId}' not found`);
            continue;
          }

          // Process each document type for this student
          for (const [docType, docFiles] of Object.entries(studentDocs)) {
            for (const file of docFiles) {
              try {
                totalProcessed++;
                
                // Check for existing documents of the same type for this student
                const existingDoc = await prisma.document.findFirst({
                  where: {
                    registrationId: student.id,
                    documentType: docType.toUpperCase()
                  }
                });

                let document;
                let action = 'created';

                if (existingDoc) {
                  // Replace existing document
                  console.log(`🔄 Replacing existing ${docType} document for ${registrationId}`);
                  
                  // Delete old document from cloud storage first
                  try {
                    await documentService.deleteDocument(existingDoc.id);
                  } catch (deleteError) {
                    console.error('Error deleting old document:', deleteError);
                  }
                  
                  // Upload new document
                  document = await documentService.uploadDocument(file, {
                    studentId: student.id,
                    registrationId: registrationId,
                    documentType: docType.toUpperCase(),
                    fileName: file.originalname,
                    fileSize: file.size
                  });
                  
                  action = 'replaced';
                } else {
                  // Create new document
                  document = await documentService.uploadDocument(file, {
                    studentId: student.id,
                    registrationId: registrationId,
                    documentType: docType.toUpperCase(),
                    fileName: file.originalname,
                    fileSize: file.size
                  });
                }

                results.push({
                  registrationId,
                  documentType: docType,
                  fileName: file.originalname,
                  documentId: document.id,
                  status: 'success',
                  action: action
                });

                totalSuccessful++;
              } catch (fileError) {
                errors.push(`Failed to upload ${file.originalname} for ${registrationId}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
              }
            }
          }
        } catch (studentError) {
          errors.push(`Error processing documents for ${registrationId}: ${studentError instanceof Error ? studentError.message : 'Unknown error'}`);
        }
      }

      // Return comprehensive results
      res.status(201).json({
        success: totalSuccessful > 0,
        summary: {
          totalProcessed,
          totalSuccessful,
          totalErrors: errors.length,
          studentsProcessed: Object.keys(organizedFiles).length
        },
        results,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Bulk document upload error:', error);
      next(error);
    }
  }

  // Fallback file organization method when organizationData is not available
  private static fallbackFileOrganization(files: Express.Multer.File[]): {[registrationId: string]: {[docType: string]: Express.Multer.File[]}} {
    const organizedFiles: {[registrationId: string]: {[docType: string]: Express.Multer.File[]}} = {};
    
    for (const file of files) {
      try {
        const fileName = file.originalname || (file as any).name || 'unknown';
        const fileNameWithoutExt = fileName.split('.')[0];
        const registrationId = fileNameWithoutExt;
        
        // Try to determine document type from file extension or default to supporting
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        let docType = 'supporting';
        
        // Simple heuristic based on common naming patterns
        if (fileName.toLowerCase().includes('photo') || fileName.toLowerCase().includes('picture')) {
          docType = 'photo';
        } else if (fileName.toLowerCase().includes('certificate') || fileName.toLowerCase().includes('cert')) {
          docType = 'certificate';
        } else if (fileName.toLowerCase().includes('transcript') || fileName.toLowerCase().includes('grade')) {
          docType = 'transcript';
        }
        
        if (!organizedFiles[registrationId]) {
          organizedFiles[registrationId] = {};
        }
        if (!organizedFiles[registrationId][docType]) {
          organizedFiles[registrationId][docType] = [];
        }
        
        organizedFiles[registrationId][docType].push(file);
      } catch (fileError) {
        console.error('Error organizing file:', file.originalname, fileError);
      }
    }
    
    return organizedFiles;
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