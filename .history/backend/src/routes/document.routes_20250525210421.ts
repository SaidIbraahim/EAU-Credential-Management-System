import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
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
router.get('/', validate(getDocumentsSchema), DocumentController.getDocuments);

// Create new document
router.post(
  '/',
  upload.single('file'),
  validate(createDocumentSchema),
  DocumentController.createDocument
);

// Get document by ID
router.get('/:id', validate(documentIdSchema), DocumentController.getDocumentById);

// Update document
router.patch('/:id', validate(updateDocumentSchema), DocumentController.updateDocument);

// Download document
router.get('/:id/download', validate(documentIdSchema), DocumentController.downloadDocument);

// Delete document
router.delete('/:id', validate(documentIdSchema), DocumentController.deleteDocument);

export default router; 