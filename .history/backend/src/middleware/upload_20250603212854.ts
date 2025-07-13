import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { storageClient, STORAGE_BUCKET_NAME, generateFileUrl } from '../config/storage';
import { randomUUID } from 'crypto';
import path from 'path';

export interface CloudStorageFile {
  key: string;
  url: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export type DocumentType = 'photo' | 'transcript' | 'certificate' | 'supporting';

export const DOCUMENT_TYPES = {
  photo: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'] as const,
    maxSize: 5 * 1024 * 1024, // 5MB
    maxCount: 1,
    extensions: ['.jpg', '.jpeg', '.png']
  },
  transcript: {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] as const,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxCount: 1,
    extensions: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  certificate: {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] as const,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxCount: 1,
    extensions: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  supporting: {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxCount: 5,
    extensions: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
  }
} as const;

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.warn(`Rejected file type: ${file.mimetype} for file: ${file.originalname}`);
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

// Function to upload file to cloud storage
export async function uploadToCloudStorage(file: Express.Multer.File): Promise<CloudStorageFile> {
  try {
    const fileExtension = path.extname(file.originalname);
    const uniqueKey = `documents/${randomUUID()}${fileExtension}`;
    
    console.log(`Uploading file to cloud storage: ${file.originalname} (${file.size} bytes)`);
    
    const putCommand = new PutObjectCommand({
      Bucket: STORAGE_BUCKET_NAME,
      Key: uniqueKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadDate: new Date().toISOString()
      }
    });

    await storageClient.send(putCommand);
    
    const fileUrl = generateFileUrl(uniqueKey);
    console.log(`File uploaded successfully: ${fileUrl}`);
    
    return {
      key: uniqueKey,
      url: fileUrl,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  } catch (error) {
    console.error('Cloud storage upload failed:', error);
    throw new Error(`Failed to upload file to cloud storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export the configured multer instance
export { upload };

// Dynamic upload middleware based on document type
export const uploadDocuments = (req: any, res: any, next: any) => {
  const documentType = req.params.documentType as DocumentType;
  
  if (!DOCUMENT_TYPES[documentType]) {
    return res.status(400).json({ error: 'Invalid document type' });
  }

  const maxCount = DOCUMENT_TYPES[documentType].maxCount;
  const uploadMiddleware = upload.array('files', maxCount);
  
  uploadMiddleware(req, res, next);
}; 