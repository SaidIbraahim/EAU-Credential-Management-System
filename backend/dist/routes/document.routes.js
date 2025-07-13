"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_1 = require("../controllers/document.controller");
const upload_1 = require("../middleware/upload");
const auth_middleware_1 = require("../middleware/auth.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
const testCloudStorage_1 = require("../utils/testCloudStorage");
const testDocumentUpload_1 = require("../utils/testDocumentUpload");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/debug/storage-test', async (_req, res) => {
    try {
        const isConnected = await (0, testCloudStorage_1.testCloudStorageConnection)();
        res.json({
            storageConnected: isConnected,
            message: 'Check server logs for detailed storage status'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Storage test failed', details: error });
    }
});
router.get('/debug/document-test', async (_req, res) => {
    try {
        await (0, testDocumentUpload_1.testDocumentUpload)();
        res.json({
            success: true,
            message: 'Document upload test completed - check server logs for details'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Document test failed', details: error });
    }
});
router.get('/', document_controller_1.DocumentController.getDocuments);
router.get('/:id', document_controller_1.DocumentController.getDocumentById);
router.get('/student/:registrationId', document_controller_1.DocumentController.getStudentDocuments);
router.post('/student/:registrationId/:documentType', (req, res, next) => {
    const documentType = req.params.documentType.toLowerCase();
    const validTypes = ['photo', 'transcript', 'certificate', 'supporting', 'PHOTO', 'TRANSCRIPT', 'CERTIFICATE', 'SUPPORTING'];
    console.log(`📝 Document upload validation - Type: ${req.params.documentType} -> ${documentType}, Valid: ${validTypes.includes(documentType)}`);
    if (!validTypes.includes(documentType)) {
        console.error(`❌ Invalid document type: ${req.params.documentType}`);
        return res.status(400).json({ error: `Invalid document type: ${req.params.documentType}. Valid types: ${validTypes.join(', ')}` });
    }
    return next();
}, upload_1.upload.array('files', 5), document_controller_1.DocumentController.createDocuments);
router.post('/bulk', auth_middleware_1.authenticate, upload_1.upload.array('files', 100), document_controller_1.DocumentController.bulkUploadDocuments);
router.put('/:id', document_controller_1.DocumentController.updateDocument);
router.get('/:id/download', document_controller_1.DocumentController.downloadDocument);
router.delete('/:id', document_controller_1.DocumentController.deleteDocument);
router.use((err, _req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected file field' });
    }
    if (err instanceof errorHandler_1.AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
});
exports.default = router;
//# sourceMappingURL=document.routes.js.map