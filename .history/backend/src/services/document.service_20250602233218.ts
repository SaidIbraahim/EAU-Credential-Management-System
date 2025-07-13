import { PrismaClient, Document } from '@prisma/client';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { storageClient, STORAGE_BUCKET_NAME, extractKeyFromUrl } from '../config/storage';
import { uploadToCloudStorage, CloudStorageFile } from '../middleware/upload';

const prisma = new PrismaClient();

export interface CreateDocumentData {
  registrationId: number; // Student ID, not registration string
  documentType: string;
  fileName: string;
  fileSize: number;
}

export interface UpdateDocumentData {
  fileName?: string;
  documentType?: string;
}

export class DocumentService {
  // Upload and create document record
  async uploadDocument(file: Express.Multer.File, documentData: CreateDocumentData): Promise<Document> {
    try {
      // Upload file to cloud storage
      const uploadResult: CloudStorageFile = await uploadToCloudStorage(file);
      
      // Create document record in database
      const document = await prisma.document.create({
        data: {
          registrationId: documentData.registrationId,
          documentType: documentData.documentType,
          fileName: uploadResult.originalName,
          fileUrl: uploadResult.url,
          fileSize: uploadResult.size,
          uploadDate: new Date()
        },
        include: {
          student: true
        }
      });

      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  // Delete document and remove from cloud storage
  async deleteDocument(id: number): Promise<void> {
    try {
      // Get document record
      const document = await prisma.document.findUnique({
        where: { id }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Extract storage key from URL
      const storageKey = extractKeyFromUrl(document.fileUrl);

      // Delete from cloud storage
      const deleteCommand = new DeleteObjectCommand({
        Bucket: STORAGE_BUCKET_NAME,
        Key: storageKey
      });

      await storageClient.send(deleteCommand);

      // Delete from database
      await prisma.document.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  // Get all documents for a student by student ID
  async getDocumentsByStudentId(studentId: number): Promise<Document[]> {
    return await prisma.document.findMany({
      where: { registrationId: studentId },
      include: {
        student: true
      },
      orderBy: { uploadDate: 'desc' }
    });
  }

  // Get all documents for a student by registration string
  async getDocumentsByRegistrationId(registrationId: string): Promise<Document[]> {
    return await prisma.document.findMany({
      where: { 
        student: {
          registrationId: registrationId
        }
      },
      include: {
        student: true
      },
      orderBy: { uploadDate: 'desc' }
    });
  }

  // Get document by ID
  async getDocumentById(id: number): Promise<Document | null> {
    return await prisma.document.findUnique({
      where: { id },
      include: {
        student: true
      }
    });
  }

  // Update document metadata (not the file itself)
  async updateDocument(id: number, updateData: UpdateDocumentData): Promise<Document> {
    return await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        student: true
      }
    });
  }

  // Get all documents with pagination
  async getAllDocuments(page: number = 1, limit: number = 10): Promise<{ documents: Document[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        skip,
        take: limit,
        include: {
          student: true
        },
        orderBy: { uploadDate: 'desc' }
      }),
      prisma.document.count()
    ]);

    return { documents, total };
  }
} 