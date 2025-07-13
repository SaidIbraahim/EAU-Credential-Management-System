import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { testCloudStorageConnection } from '../utils/testCloudStorage';
import { testDocumentUpload } from '../utils/testDocumentUpload';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Debug route to test cloud storage connection (remove in production)
router.get('/debug/storage-test', async (_req, res) => {
  try {
    const isConnected = await testCloudStorageConnection();
    res.json({ 
      storageConnected: isConnected,
      message: 'Check server logs for detailed storage status'
    });
  } catch (error) {
    res.status(500).json({ error: 'Storage test failed', details: error });
  }
});

// Debug route to test document upload system
router.get('/debug/document-test', async (_req, res) => {
  try {
    await testDocumentUpload();
    res.json({ 
      success: true,
      message: 'Document upload test completed - check server logs for details'
    });
  } catch (error) {
    res.status(500).json({ error: 'Document test failed', details: error });
  }
});

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

// Stream document directly (proxy method)
router.get('/:id/stream', DocumentController.streamDocument);

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