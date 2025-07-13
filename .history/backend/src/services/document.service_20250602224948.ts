import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import { DocumentType, DOCUMENT_TYPES } from '../middleware/upload';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, BUCKET_NAME } from '../config/storage';
import pool from '../config/database';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
(async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
})();

interface CreateDocumentInput {
  fileName?: string;
  documentType: DocumentType;
  registrationId: string | number;
  files: Express.Multer.File[];
}

interface UpdateDocumentInput {
  fileName?: string;
}

export interface DocumentModel {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  registrationId: string;
  createdAt: Date;
}

export class DocumentService {
  static async createDocuments(data: CreateDocumentInput) {
    const { fileName, documentType, registrationId, files } = data;

    // Validate student exists by registrationId (which is a string in our API)
    const student = await prisma.student.findFirst({
      where: { registrationId: registrationId.toString() }
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    // Validate number of files
    if (files.length > DOCUMENT_TYPES[documentType].maxCount) {
      throw new AppError(`Maximum ${DOCUMENT_TYPES[documentType].maxCount} files allowed for ${documentType}`, 400);
    }

    const documents = [];

    for (const file of files) {
      try {
        // Validate file type
        const allowedTypes = DOCUMENT_TYPES[documentType].allowedTypes as readonly string[];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new AppError(`Invalid file type. Allowed types for ${documentType}: ${DOCUMENT_TYPES[documentType].extensions.join(', ')}`, 400);
        }

        // Validate file size
        if (file.size > DOCUMENT_TYPES[documentType].maxSize) {
          throw new AppError(`File size exceeds ${DOCUMENT_TYPES[documentType].maxSize / (1024 * 1024)}MB limit`, 400);
        }

        // Generate unique filename and R2 key
        const fileExt = path.extname(file.originalname);
        const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const r2Key = `documents/${student.registrationId}/${documentType}/${uniqueFileName}`;

        // Read file content
        const fileContent = await fs.readFile(file.path);

        // Upload to R2
        const uploadCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: r2Key,
          Body: fileContent,
          ContentType: file.mimetype,
          ContentLength: file.size,
          Metadata: {
            originalName: file.originalname,
            registrationId: student.registrationId,
            documentType: documentType
          }
        });

        await r2Client.send(uploadCommand);

        // Generate R2 URL - using your R2 domain
        const fileUrl = `https://${BUCKET_NAME}.r2.dev/${r2Key}`;

        // Create document record
        const document = await prisma.document.create({
          data: {
            fileName: fileName || file.originalname,
            documentType,
            fileType: file.mimetype,
            fileSize: file.size,
            fileUrl: fileUrl,
            registrationId: student.id // Use the actual student ID from database for the foreign key
          }
        });

        documents.push(document);
        logger.info(`Document created: ${document.id} for student: ${student.registrationId} - uploaded to R2: ${r2Key}`);

        // Clean up temporary file
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          logger.warn(`Failed to cleanup temp file: ${file.path}`, unlinkError);
        }

      } catch (error) {
        // Cleanup temporary file if upload fails
        try {
          if (file.path) {
            await fs.unlink(file.path);
          }
        } catch (unlinkError) {
          logger.error('Failed to cleanup file after error:', unlinkError);
        }
        throw error;
      }
    }

    return documents;
  }

  static async getDocuments(
    page = 1,
    limit = 10,
    filters?: {
      registrationId?: number;
      documentType?: DocumentType;
    }
  ) {
    const skip = (page - 1) * limit;

    const where = {
      ...(filters?.registrationId && { registrationId: filters.registrationId }),
      ...(filters?.documentType && { documentType: filters.documentType })
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              registrationId: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.document.count({ where })
    ]);

    return {
      documents,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getStudentDocuments(registrationId: string) {
    // Find student by registration ID to get internal ID
    const student = await prisma.student.findFirst({
      where: { registrationId: registrationId }
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const documents = await prisma.document.findMany({
      where: { registrationId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            registrationId: true
          }
        }
      }
    });

    return documents;
  }

  static async getDocumentById(id: number) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            registrationId: true
          }
        }
      }
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    return document;
  }

  static async updateDocument(id: number, data: UpdateDocumentInput) {
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            registrationId: true
          }
        }
      }
    });

    logger.info(`Document updated: ${id}`);
    return updatedDocument;
  }

  static async deleteDocument(id: number) {
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Delete file from R2
    try {
      const r2Key = document.fileUrl.replace(`https://${BUCKET_NAME}.r2.dev/`, '');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: r2Key
      });
      await r2Client.send(deleteCommand);
      logger.info(`File deleted from R2: ${r2Key}`);
    } catch (error) {
      logger.warn(`Failed to delete file from R2: ${document.fileUrl}`, error);
    }

    await prisma.document.delete({
      where: { id }
    });

    logger.info(`Document deleted: ${id}`);
    return { success: true };
  }

  static async downloadDocument(id: number) {
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // For R2, we can either return the direct URL or generate a presigned URL
    // Since documents might be private, let's return the direct URL for now
    // You can implement presigned URLs if you need temporary access
    return {
      url: document.fileUrl,
      mimeType: document.fileType || 'application/octet-stream',
      originalName: document.fileName
    };
  }

  // Legacy methods for compatibility - can be removed later
  async uploadDocument(
    file: Express.Multer.File,
    registrationId: string
  ): Promise<DocumentModel> {
    const uuid = randomUUID();
    const key = `documents/${registrationId}/${uuid}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await r2Client.send(command);

    const fileUrl = `https://${BUCKET_NAME}.r2.cloudflarestorage.com/${key}`;

    const result = await pool.query(
      'INSERT INTO documents (id, file_name, file_type, file_size, url, registration_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [uuid, file.originalname, file.mimetype, file.size, fileUrl, registrationId]
    );

    return this.mapDocumentFromDb(result.rows[0]);
  }

  async deleteDocumentLegacy(id: string): Promise<void> {
    const result = await pool.query('SELECT url FROM documents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Document not found');
    }

    const url = result.rows[0].url;
    const key = this.getKeyFromUrl(url);

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    await pool.query('DELETE FROM documents WHERE id = $1', [id]);
  }

  async getDocumentsByStudentId(registrationId: string): Promise<DocumentModel[]> {
    const result = await pool.query('SELECT * FROM documents WHERE registration_id = $1', [registrationId]);
    return result.rows.map(row => this.mapDocumentFromDb(row));
  }

  private mapDocumentFromDb(row: any): DocumentModel {
    return {
      id: row.id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      fileUrl: row.url,
      registrationId: row.registration_id,
      createdAt: row.created_at,
    };
  }

  private getKeyFromUrl(url: string): string {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  }
} 