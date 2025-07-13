import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { uploadMiddleware } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { 
  createDocumentSchema, 
  updateDocumentSchema, 
  documentIdSchema, 
  getDocumentsSchema 
} from '../validators/document.validator';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all documents with pagination and filters
router.get(
  '/',
  validate(getDocumentsSchema),
  DocumentController.getDocuments
);

// Get documents for a specific student
router.get(
  '/student/:studentId',
  DocumentController.getStudentDocuments
);

// Get a specific document
router.get(
  '/:id',
  validate(documentIdSchema),
  DocumentController.getDocumentById
);

// Upload documents by type
router.post(
  '/upload/:type',
  validate(createDocumentSchema),
  (req, res, next) => {
    const type = req.params.type;
    const upload = uploadMiddleware[type as keyof typeof uploadMiddleware];
    
    if (upload) {
      upload(req, res, (err: any) => {
        if (err) {
          next(err);
        } else {
          next();
        }
      });
    } else {
      next(new AppError(400, 'Invalid document type'));
    }
  },
  DocumentController.createDocuments
);

// Update document metadata
router.put(
  '/:id',
  validate(updateDocumentSchema),
  DocumentController.updateDocument
);

// Download document
router.get(
  '/:id/download',
  validate(documentIdSchema),
  DocumentController.downloadDocument
);

// Delete document
router.delete(
  '/:id',
  validate(documentIdSchema),
  DocumentController.deleteDocument
);

export default router; 