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

// Get all documents (paginated)
router.get('/', validate(getDocumentsSchema), ((req, res, next) => {
  DocumentController.getDocuments(req, res, next);
}) as RequestHandler);

// Get student's documents grouped by type
router.get('/student/:studentId', ((req, res, next) => {
  DocumentController.getStudentDocuments(req, res, next);
}) as RequestHandler);

// Upload documents by type
router.post(
  '/:type/upload',
  ((req, res, next) => {
    const type = req.params.type as DocumentType;
    if (!type || !uploadMiddleware[type]) {
      res.status(400).json({ message: 'Invalid document type' });
      return;
    }
    uploadMiddleware[type](req, res, next);
  }) as RequestHandler,
  validate(createDocumentSchema),
  ((req, res, next) => {
    DocumentController.createDocuments(req, res, next);
  }) as RequestHandler
);

// Get document by ID
router.get('/:id', validate(documentIdSchema), ((req, res, next) => {
  DocumentController.getDocumentById(req, res, next);
}) as RequestHandler);

// Update document
router.patch('/:id', validate(updateDocumentSchema), ((req, res, next) => {
  DocumentController.updateDocument(req, res, next);
}) as RequestHandler);

// Download document
router.get('/:id/download', validate(documentIdSchema), ((req, res, next) => {
  DocumentController.downloadDocument(req, res, next);
}) as RequestHandler);

// Delete document
router.delete('/:id', validate(documentIdSchema), ((req, res, next) => {
  DocumentController.deleteDocument(req, res, next);
}) as RequestHandler);

export default router; 