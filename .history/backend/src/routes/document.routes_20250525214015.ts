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
router.get('/', validate(getDocumentsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await DocumentController.getDocuments(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Get student's documents grouped by type
router.get('/student/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await DocumentController.getStudentDocuments(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Upload documents by type
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DocumentController.createDocuments(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get document by ID
router.get('/:id', validate(documentIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await DocumentController.getDocumentById(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Update document
router.patch('/:id', validate(updateDocumentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await DocumentController.updateDocument(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Download document
router.get('/:id/download', validate(documentIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await DocumentController.downloadDocument(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Delete document
router.delete('/:id', validate(documentIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await DocumentController.deleteDocument(req, res, next);
  } catch (error) {
    next(error);
  }
});

export default router; 