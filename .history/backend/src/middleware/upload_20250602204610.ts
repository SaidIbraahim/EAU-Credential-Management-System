import multer, { StorageEngine } from 'multer';
import path from 'path';
import { AppError } from './errorHandler';

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

// Multer storage configuration
const storage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'temp');
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const documentType = req.params.documentType as DocumentType;
  
  if (!DOCUMENT_TYPES[documentType]) {
    cb(new AppError('Invalid document type', 400));
    return;
  }

  // Check if the file type is allowed for this document type
  const allowedTypes = DOCUMENT_TYPES[documentType].allowedTypes as readonly string[];
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new AppError(`Invalid file type. Allowed types for ${documentType}: ${DOCUMENT_TYPES[documentType].extensions.join(', ')}`, 400));
    return;
  }

  cb(null, true);
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

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