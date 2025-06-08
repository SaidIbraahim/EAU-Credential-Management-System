import { PrismaClient, Document } from '@prisma/client';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { storageClient, STORAGE_BUCKET_NAME, extractKeyFromUrl, generatePresignedUrl } from '../config/storage';
import { uploadToCloudStorage, CloudStorageFile } from '../middleware/upload';

const prisma = new PrismaClient();

export interface CreateDocumentData {
  studentId: number; // Student's numeric ID for foreign key
  registrationId: string; // Student's registration ID string for reference
  documentType: string;
  fileName: string;
  fileSize: number;
}

export interface UpdateDocumentData {
  fileName?: string;
  documentType?: string;
}

// Extended document interface with presigned URL
export interface DocumentWithPresignedUrl extends Document {
  presignedUrl?: string;
}

export class DocumentService {
  // Upload and create document record
  async uploadDocument(file: Express.Multer.File, documentData: CreateDocumentData): Promise<Document> {
    try {
      // Upload file to cloud storage
      const uploadResult: CloudStorageFile = await uploadToCloudStorage(file);
      
      // Store the storage key instead of the public URL for security
      const storageKey = uploadResult.key;
      
      // Create document record in database
      const document = await prisma.document.create({
        data: {
          registrationId: documentData.studentId, // Use student's numeric ID for foreign key
          documentType: documentData.documentType,
          fileName: uploadResult.originalName,
          fileUrl: storageKey, // Store storage key instead of public URL
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
      throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ⚡ NEW: Parallel document upload for MUCH faster performance
  async uploadDocumentsParallel(
    files: Express.Multer.File[], 
    studentId: number, 
    registrationId: string,
    documentType: string
  ): Promise<Document[]> {
    try {
      console.time(`⚡ Parallel Upload ${files.length} files for ${registrationId}`);
      
      // Upload all files to cloud storage in parallel
      const uploadPromises = files.map(file => uploadToCloudStorage(file));
      const uploadResults = await Promise.all(uploadPromises);
      
      console.log(`✅ Cloud uploads completed for ${files.length} files for student ${registrationId}`);
      
      // Create all database records in a single transaction
      const documentData = uploadResults.map((result) => ({
        registrationId: studentId,
        documentType: documentType,
        fileName: result.originalName,
        fileUrl: result.key,
        fileSize: result.size,
        uploadDate: new Date()
      }));
      
      // Batch database insert for much faster performance
      const documents = await prisma.$transaction(
        documentData.map(data => 
          prisma.document.create({
            data,
            include: { student: true }
          })
        )
      );
      
      console.timeEnd(`⚡ Parallel Upload ${files.length} files for ${registrationId}`);
      console.log(`🚀 Performance: Uploaded ${files.length} files in parallel for ${registrationId}!`);
      
      return documents;
    } catch (error) {
      console.error(`Error in parallel upload for ${registrationId}:`, error);
      throw new Error(`Failed to upload documents in parallel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to add presigned URLs to documents
  private async addPresignedUrls(documents: Document[]): Promise<DocumentWithPresignedUrl[]> {
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        try {
          // Handle both storage keys and full URLs
          let storageKey = doc.fileUrl;
          
          // If it's a full URL, extract the key
          if (doc.fileUrl.startsWith('http')) {
            storageKey = extractKeyFromUrl(doc.fileUrl);
            console.log(`Extracted key from URL: ${doc.fileUrl} -> ${storageKey}`);
          }
          
          // Generate presigned URL for the storage key
          const presignedUrl = await generatePresignedUrl(storageKey, 3600); // 1 hour expiry
          console.log(`Generated presigned URL for document ${doc.id}: ${presignedUrl}`);
          
          return {
            ...doc,
            presignedUrl
          };
        } catch (error) {
          console.error(`Error generating presigned URL for document ${doc.id}:`, error);
          console.error(`File URL: ${doc.fileUrl}`);
          return {
            ...doc,
            presignedUrl: undefined
          };
        }
      })
    );
    
    return documentsWithUrls;
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

      // Use the stored key directly (if it's already a key) or extract from URL
      const storageKey = document.fileUrl.startsWith('documents/') 
        ? document.fileUrl 
        : extractKeyFromUrl(document.fileUrl);

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
  async getDocumentsByStudentId(studentId: number): Promise<DocumentWithPresignedUrl[]> {
    const documents = await prisma.document.findMany({
      where: { registrationId: studentId },
      include: {
        student: true
      },
      orderBy: { uploadDate: 'desc' }
    });
    
    return this.addPresignedUrls(documents);
  }

  // Get all documents for a student by registration string
  async getDocumentsByRegistrationId(registrationId: string): Promise<DocumentWithPresignedUrl[]> {
    const documents = await prisma.document.findMany({
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
    
    return this.addPresignedUrls(documents);
  }

  // Get document by ID
  async getDocumentById(id: number): Promise<DocumentWithPresignedUrl | null> {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        student: true
      }
    });
    
    if (!document) return null;
    
    const documentsWithUrls = await this.addPresignedUrls([document]);
    return documentsWithUrls[0];
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
  async getAllDocuments(page: number = 1, limit: number = 10): Promise<{ documents: DocumentWithPresignedUrl[], total: number }> {
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

    const documentsWithUrls = await this.addPresignedUrls(documents);
    return { documents: documentsWithUrls, total };
  }
} 