import { Router, Request, Response, NextFunction } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { uploadMiddleware, DocumentType } from '../middleware/upload';
import {
  createDocumentSchema,
  updateDocumentSchema,
  documentIdSchema,
  getDocumentsSchema,
} from '../validators/document.validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all documents (paginated)
router.get('/', validate(getDocumentsSchema), (req: Request, res: Response, next: NextFunction) => {
  return DocumentController.getDocuments(req, res, next);
});

// Get student's documents grouped by type
router.get('/student/:studentId', (req: Request, res: Response, next: NextFunction) => {
  return DocumentController.getStudentDocuments(req, res, next);
});

// Upload documents by type
router.post(
  '/:type/upload',
  (req: Request, res: Response, next: NextFunction) => {
    const type = req.params.type as DocumentType;
    if (!type || !uploadMiddleware[type]) {
      return res.status(400).json({ message: 'Invalid document type' });
    }
    uploadMiddleware[type](req, res, next);
  },
  validate(createDocumentSchema),
  (req: Request, res: Response, next: NextFunction) => {
    return DocumentController.createDocuments(req, res, next);
  }
);

// Get document by ID
router.get('/:id', validate(documentIdSchema), (req: Request, res: Response, next: NextFunction) => {
  return DocumentController.getDocumentById(req, res, next);
});

// Update document
router.patch('/:id', validate(updateDocumentSchema), (req: Request, res: Response, next: NextFunction) => {
  return DocumentController.updateDocument(req, res, next);
});

// Download document
router.get('/:id/download', validate(documentIdSchema), (req: Request, res: Response, next: NextFunction) => {
  return DocumentController.downloadDocument(req, res, next);
});

// Delete document
router.delete('/:id', validate(documentIdSchema), (req: Request, res: Response, next: NextFunction) => {
  return DocumentController.deleteDocument(req, res, next);
});

export default router; 