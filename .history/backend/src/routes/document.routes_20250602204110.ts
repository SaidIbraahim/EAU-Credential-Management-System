import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all documents with pagination and filters
router.get('/', DocumentController.getDocuments);

// Get document by ID
router.get('/:id', DocumentController.getDocumentById);

// Get documents by student registration ID
router.get('/student/:registrationId', DocumentController.getStudentDocuments);

// Upload document for a specific student and document type
router.post('/student/:registrationId/:documentType', 
  (req, res, next) => {
    const documentType = req.params.documentType;
    const validTypes = ['photo', 'transcript', 'certificate', 'supporting'];
    
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }
    
    return next();
  },
  upload.array('files', 5), // Allow up to 5 files
  DocumentController.createDocuments
);

// Update document
router.put('/:id', DocumentController.updateDocument);

// Download document
router.get('/:id/download', DocumentController.downloadDocument);

// Delete document
router.delete('/:id', DocumentController.deleteDocument);

// Error handling middleware for this route
router.use((err: any, _req: any, res: any, next: any) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size too large' });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Too many files' });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field' });
  }
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  
  next(err);
});

export default router; 