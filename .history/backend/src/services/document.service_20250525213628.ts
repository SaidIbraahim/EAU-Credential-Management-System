import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import { DocumentType, DOCUMENT_TYPES } from '../middleware/upload';

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
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
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
            status: 'PENDING',
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
      status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    }
  ) {
    const skip = (page - 1) * limit;

    const where = {
      ...(filters?.studentId && { studentId: filters.studentId }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status })
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

    // Group documents by type
    const groupedDocuments = {
      photo: documents.filter(doc => doc.type === 'photo'),
      transcript: documents.filter(doc => doc.type === 'transcript'),
      certificate: documents.filter(doc => doc.type === 'certificate'),
      supporting: documents.filter(doc => doc.type === 'supporting')
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
} 