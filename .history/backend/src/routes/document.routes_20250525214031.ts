import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
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

const asyncHandler = (fn: RequestHandler): RequestHandler => 
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Get all documents (paginated)
router.get('/', validate(getDocumentsSchema), asyncHandler(DocumentController.getDocuments));

// Get student's documents grouped by type
router.get('/student/:studentId', asyncHandler(DocumentController.getStudentDocuments));

// Upload documents by type
const handleUpload: RequestHandler = (req, res, next) => {
  const type = req.params.type as DocumentType;
  if (!type || !uploadMiddleware[type]) {
    res.status(400).json({ message: 'Invalid document type' });
    return;
  }
  uploadMiddleware[type](req, res, next);
};

router.post(
  '/:type/upload',
  handleUpload,
  validate(createDocumentSchema),
  asyncHandler(DocumentController.createDocuments)
);

// Get document by ID
router.get('/:id', validate(documentIdSchema), asyncHandler(DocumentController.getDocumentById));

// Update document
router.patch('/:id', validate(updateDocumentSchema), asyncHandler(DocumentController.updateDocument));

// Download document
router.get('/:id/download', validate(documentIdSchema), asyncHandler(DocumentController.downloadDocument));

// Delete document
router.delete('/:id', validate(documentIdSchema), asyncHandler(DocumentController.deleteDocument));

export default router; 