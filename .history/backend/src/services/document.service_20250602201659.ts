import { PrismaClient, Document } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import { DocumentType, DOCUMENT_TYPES } from '../middleware/upload';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
  registrationId: number;
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

    // Validate student exists by registrationId
    const student = await prisma.student.findFirst({
      where: { registrationId: registrationId.toString() }
    });

    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    // Validate number of files
    if (files.length > DOCUMENT_TYPES[documentType].maxCount) {
      throw new AppError(400, `Maximum ${DOCUMENT_TYPES[documentType].maxCount} files allowed for ${documentType}`);
    }

    const documents = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!DOCUMENT_TYPES[documentType].allowedTypes.includes(file.mimetype)) {
          throw new AppError(400, `Invalid file type. Allowed types for ${documentType}: ${DOCUMENT_TYPES[documentType].extensions.join(', ')}`);
        }

        // Validate file size
        if (file.size > DOCUMENT_TYPES[documentType].maxSize) {
          throw new AppError(400, `File size exceeds ${DOCUMENT_TYPES[documentType].maxSize / (1024 * 1024)}MB limit`);
        }

        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFileName);

        // Move file from temp upload to permanent location
        await fs.rename(file.path, filePath);

        // Create document record
        const document = await prisma.document.create({
          data: {
            fileName: fileName || file.originalname,
            documentType,
            fileType: file.mimetype,
            fileSize: file.size,
            fileUrl: `/uploads/${uniqueFileName}`,
            registrationId: student.id // Use the actual student ID from database
          }
        });

        documents.push(document);
        logger.info(`Document created: ${document.id} for student: ${registrationId}`);

      } catch (error) {
        // Cleanup file if database operation fails
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

  static async getStudentDocuments(registrationId: number) {
    // Find student by registration ID to get internal ID
    const student = await prisma.student.findFirst({
      where: { registrationId: registrationId.toString() }
    });

    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    const documents = await prisma.document.findMany({
      where: { registrationId: student.id },
      orderBy: { uploadDate: 'desc' },
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
      throw new AppError(404, 'Document not found');
    }

    return document;
  }

  static async updateDocument(id: number, data: UpdateDocumentInput) {
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new AppError(404, 'Document not found');
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
      throw new AppError(404, 'Document not found');
    }

    // Delete file from filesystem
    try {
      const fileName = path.basename(document.fileUrl);
      const filePath = path.join(UPLOAD_DIR, fileName);
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn(`Failed to delete file: ${document.fileUrl}`, error);
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
      throw new AppError(404, 'Document not found');
    }

    const fileName = path.basename(document.fileUrl);
    const filePath = path.join(UPLOAD_DIR, fileName);

    try {
      await fs.access(filePath);
    } catch {
      throw new AppError(404, 'File not found on disk');
    }

    return {
      path: filePath,
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