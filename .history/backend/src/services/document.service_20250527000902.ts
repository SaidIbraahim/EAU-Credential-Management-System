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
  title: string;
  description?: string;
  type: DocumentType;
  studentId: number;
  files: Express.Multer.File[];
}

interface UpdateDocumentInput {
  title?: string;
  description?: string;
}

export interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  studentId: string;
  createdAt: Date;
}

export class DocumentService {
  static async createDocuments(data: CreateDocumentInput) {
    const { title, description, type, studentId, files } = data;

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    // Validate number of files
    if (files.length > DOCUMENT_TYPES[type].maxCount) {
      throw new AppError(400, `Maximum ${DOCUMENT_TYPES[type].maxCount} files allowed for ${type}`);
    }

    const documents = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!DOCUMENT_TYPES[type].allowedTypes.includes(file.mimetype)) {
          throw new AppError(400, `Invalid file type. Allowed types for ${type}: ${DOCUMENT_TYPES[type].extensions.join(', ')}`);
        }

        // Validate file size
        if (file.size > DOCUMENT_TYPES[type].maxSize) {
          throw new AppError(400, `File size exceeds ${DOCUMENT_TYPES[type].maxSize / (1024 * 1024)}MB limit`);
        }

        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        // Move file from temp upload to permanent location
        await fs.rename(file.path, filePath);

        // Create document record
        const document = await prisma.document.create({
          data: {
            title,
            description,
            type,
            fileName,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            studentId
          }
        });

        documents.push(document);
        logger.info(`Document created: ${document.id} for student: ${studentId}`);

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
      studentId?: number;
      type?: DocumentType;
    }
  ) {
    const skip = (page - 1) * limit;

    const where = {
      ...(filters?.studentId && { studentId: filters.studentId }),
      ...(filters?.type && { type: filters.type })
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
              name: true
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

  static async getStudentDocuments(studentId: number) {
    const documents = await prisma.document.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Group documents by type as expected by frontend
    type DocumentWithStudent = Awaited<ReturnType<typeof prisma.document.findMany>>[number];
    
    const groupedDocuments = {
      photo: documents.filter((doc: DocumentWithStudent) => doc.type === 'PHOTO'),
      transcript: documents.filter((doc: DocumentWithStudent) => doc.type === 'TRANSCRIPT'),
      certificate: documents.filter((doc: DocumentWithStudent) => doc.type === 'CERTIFICATE'),
      supporting: documents.filter((doc: DocumentWithStudent) => doc.type === 'SUPPORTING')
    };

    return groupedDocuments;
  }

  static async getDocumentById(id: number) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true
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
            name: true
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

    try {
      // Delete file
      await fs.unlink(path.join(UPLOAD_DIR, document.fileName));
      
      // Delete database record
      await prisma.document.delete({
        where: { id }
      });

      logger.info(`Document deleted: ${id}`);
      return { message: 'Document deleted successfully' };

    } catch (error) {
      logger.error(`Failed to delete document ${id}:`, error);
      throw new AppError(500, 'Failed to delete document');
    }
  }

  static async downloadDocument(id: number) {
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new AppError(404, 'Document not found');
    }

    const filePath = path.join(UPLOAD_DIR, document.fileName);

    try {
      await fs.access(filePath);
      return {
        path: filePath,
        originalName: document.originalName,
        mimeType: document.mimeType
      };
    } catch {
      throw new AppError(404, 'Document file not found');
    }
  }

  async uploadDocument(
    file: Express.Multer.File,
    studentId: string
  ): Promise<Document> {
    const fileId = randomUUID();
    const key = `${studentId}/${fileId}-${file.originalname}`;

    // Upload to R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    // Generate presigned URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    // Save to database
    const result = await pool.query(
      `INSERT INTO documents (file_name, file_type, file_size, url, student_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, file_name, file_type, file_size, url, student_id, created_at`,
      [file.originalname, file.mimetype, file.size, url, studentId]
    );

    return this.mapDocumentFromDb(result.rows[0]);
  }

  async deleteDocument(id: string): Promise<void> {
    const result = await pool.query(
      'SELECT url FROM documents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Document not found');
    }

    const key = this.getKeyFromUrl(result.rows[0].url);

    // Delete from R2
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );

    // Delete from database
    await pool.query('DELETE FROM documents WHERE id = $1', [id]);
  }

  async getDocumentsByStudentId(studentId: string): Promise<Document[]> {
    const result = await pool.query(
      'SELECT * FROM documents WHERE student_id = $1',
      [studentId]
    );

    return result.rows.map(this.mapDocumentFromDb);
  }

  private mapDocumentFromDb(row: any): Document {
    return {
      id: row.id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      url: row.url,
      studentId: row.student_id,
      createdAt: row.created_at,
    };
  }

  private getKeyFromUrl(url: string): string {
    const urlObj = new URL(url);
    return urlObj.pathname.slice(1); // Remove leading slash
  }
} 