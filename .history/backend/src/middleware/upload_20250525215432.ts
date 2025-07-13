import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from './errorHandler';

export type DocumentType = 'photo' | 'transcript' | 'certificate' | 'supporting';

export const DOCUMENT_TYPES = {
  photo: {
    maxCount: 1,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: ['.jpg', '.jpeg', '.png']
  },
  transcript: {
    maxCount: 1,
    allowedTypes: ['application/pdf'],
    maxSize: 5 * 1024 * 1024,
    extensions: ['.pdf']
  },
  certificate: {
    maxCount: 1,
    allowedTypes: ['application/pdf'],
    maxSize: 5 * 1024 * 1024,
    extensions: ['.pdf']
  },
  supporting: {
    maxCount: 5,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ],
    maxSize: 5 * 1024 * 1024,
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png']
  }
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const documentType = req.params.type as DocumentType;
  
  if (!documentType || !DOCUMENT_TYPES[documentType]) {
    cb(new AppError(400, 'Invalid document type'));
    return;
  }

  if (!DOCUMENT_TYPES[documentType].allowedTypes.includes(file.mimetype)) {
    cb(new AppError(400, `Invalid file type. Allowed types for ${documentType}: ${DOCUMENT_TYPES[documentType].extensions.join(', ')}`));
    return;
  }

  cb(null, true);
};

// Configure multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create upload middleware for each document type
export const uploadMiddleware = {
  photo: upload.array('files', DOCUMENT_TYPES.photo.maxCount),
  transcript: upload.array('files', DOCUMENT_TYPES.transcript.maxCount),
  certificate: upload.array('files', DOCUMENT_TYPES.certificate.maxCount),
  supporting: upload.array('files', DOCUMENT_TYPES.supporting.maxCount)
}; 