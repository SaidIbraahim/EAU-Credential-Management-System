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
    // Allow common document and image formats
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Office documents are allowed.'));
    }
  }
});

// Function to upload file to cloud storage
export async function uploadToCloudStorage(file: Express.Multer.File): Promise<CloudStorageFile> {
  // Generate unique filename
  const fileExtension = path.extname(file.originalname);
  const fileName = `${randomUUID()}${fileExtension}`;
  const key = `documents/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: STORAGE_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ContentLength: file.size,
    // Optional: Set cache control for better performance
    CacheControl: 'max-age=31536000', // 1 year
    // Optional: Set metadata
    Metadata: {
      originalName: file.originalname,
      uploadedAt: new Date().toISOString()
    }
  });

  try {
    await storageClient.send(command);
    
    return {
      key,
      url: generateFileUrl(key),
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  } catch (error) {
    console.error('Cloud storage upload error:', error);
    throw new Error('Failed to upload file to cloud storage');
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