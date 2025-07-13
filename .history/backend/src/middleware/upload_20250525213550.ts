import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from './errorHandler';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Document type configurations
export const DOCUMENT_TYPES = {
  photo: {
    mimeTypes: ['image/jpeg', 'image/png'],
    extensions: ['.jpg', '.jpeg', '.png'],
    maxCount: 5
  },
  transcript: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxCount: 3
  },
  certificate: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxCount: 3
  },
  supporting: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ],
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'],
    maxCount: 10
  }
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate temporary filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `temp-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const docType = req.params.type as DocumentType;
  
  if (!docType || !DOCUMENT_TYPES[docType]) {
    cb(new AppError(400, 'Invalid document type'));
    return;
  }

  if (!DOCUMENT_TYPES[docType].mimeTypes.includes(file.mimetype)) {
    cb(new AppError(400, `Invalid file type. Allowed types for ${docType}: ${DOCUMENT_TYPES[docType].extensions.join(', ')}`));
    return;
  }

  cb(null, true);
};

// Create multer instance with configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Create upload middleware for each document type
export const uploadMiddleware = {
  photo: upload.array('files', DOCUMENT_TYPES.photo.maxCount),
  transcript: upload.array('files', DOCUMENT_TYPES.transcript.maxCount),
  certificate: upload.array('files', DOCUMENT_TYPES.certificate.maxCount),
  supporting: upload.array('files', DOCUMENT_TYPES.supporting.maxCount)
}; 