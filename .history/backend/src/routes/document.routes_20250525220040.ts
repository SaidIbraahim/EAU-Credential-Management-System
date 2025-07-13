import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { uploadMiddleware } from '../middleware/upload';
import { validateRequest } from '../middleware/validateRequest';
import { 
  createDocumentSchema, 
  updateDocumentSchema, 
  documentIdSchema, 
  getDocumentsSchema 
} from '../validators/document.validator';
import { isAuthenticated } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all documents with pagination and filters
router.get(
  '/',
  validateRequest(getDocumentsSchema),
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
  validateRequest(documentIdSchema),
  DocumentController.getDocumentById
);

// Upload documents by type
router.post(
  '/upload/:type',
  validateRequest(createDocumentSchema),
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
  validateRequest(updateDocumentSchema),
  DocumentController.updateDocument
);

// Download document
router.get(
  '/:id/download',
  validateRequest(documentIdSchema),
  DocumentController.downloadDocument
);

// Delete document
router.delete(
  '/:id',
  validateRequest(documentIdSchema),
  DocumentController.deleteDocument
);

export default router; 