"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const document_service_1 = require("../services/document.service");
const errorHandler_1 = require("../middleware/errorHandler");
const documentService = new document_service_1.DocumentService();
class DocumentController {
    static async getDocuments(req, res, next) {
        try {
            const { page, limit } = req.query;
            const documents = await documentService.getAllDocuments(Number(page) || 1, Number(limit) || 10);
            res.json(documents);
        }
        catch (error) {
            next(error);
        }
    }
    static async getStudentDocuments(req, res, next) {
        try {
            const { registrationId } = req.params;
            const documents = await documentService.getDocumentsByRegistrationId(registrationId);
            res.json(documents);
        }
        catch (error) {
            next(error);
        }
    }
    static async createDocuments(req, res, next) {
        try {
            console.time('⚡ Document Upload Performance');
            const { registrationId } = req.params;
            const documentType = req.params.documentType.toUpperCase();
            const files = req.files;
            if (!files || files.length === 0) {
                throw new errorHandler_1.AppError('No files uploaded', 400);
            }
            console.log(`📤 Starting ${files.length} file upload(s) for ${registrationId} (${documentType})`);
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const student = await prisma.student.findFirst({
                where: { registrationId: registrationId },
                select: { id: true, registrationId: true }
            });
            if (!student) {
                throw new errorHandler_1.AppError(`Student with registration ID '${registrationId}' not found`, 404);
            }
            if (files.length > 1) {
                const documents = await documentService.uploadDocumentsParallel(files, student.id, registrationId, documentType);
                console.timeEnd('⚡ Document Upload Performance');
                console.log(`🚀 Parallel upload completed: ${files.length} files for ${registrationId}`);
                res.status(201).json({
                    success: true,
                    count: documents.length,
                    documents: documents.map(doc => ({
                        id: doc.id,
                        fileName: doc.fileName,
                        documentType: doc.documentType,
                        fileSize: doc.fileSize,
                        uploadDate: doc.uploadDate
                    }))
                });
            }
            else {
                const file = files[0];
                const document = await documentService.uploadDocument(file, {
                    studentId: student.id,
                    registrationId: registrationId,
                    documentType,
                    fileName: file.originalname,
                    fileSize: file.size
                });
                console.timeEnd('⚡ Document Upload Performance');
                res.status(201).json(document);
            }
        }
        catch (error) {
            console.error('Document upload error:', error);
            next(error);
        }
    }
    static async bulkUploadDocuments(req, res, next) {
        try {
            const files = req.files;
            const { organizationData } = req.body;
            if (!files || files.length === 0) {
                throw new errorHandler_1.AppError('No files uploaded', 400);
            }
            console.log('📥 Bulk upload request:', {
                filesCount: files.length,
                organizationData: organizationData ? 'provided' : 'missing',
                fileNames: files.map(f => f.originalname || 'no-name'),
                fileSizes: files.map(f => f.size)
            });
            let organizedFiles = {};
            if (organizationData) {
                try {
                    const parsedOrgData = typeof organizationData === 'string'
                        ? JSON.parse(organizationData)
                        : organizationData;
                    console.log('📋 Using organization data:', parsedOrgData);
                    for (const file of files) {
                        const fileName = file.originalname || file.name || 'unknown';
                        let found = false;
                        for (const [registrationId, studentDocs] of Object.entries(parsedOrgData)) {
                            for (const [docType, docFiles] of Object.entries(studentDocs)) {
                                const fileList = docFiles;
                                for (const orgFile of fileList) {
                                    if (orgFile.name === fileName || fileName.includes(registrationId)) {
                                        if (!organizedFiles[registrationId]) {
                                            organizedFiles[registrationId] = {};
                                        }
                                        if (!organizedFiles[registrationId][docType]) {
                                            organizedFiles[registrationId][docType] = [];
                                        }
                                        organizedFiles[registrationId][docType].push(file);
                                        found = true;
                                        break;
                                    }
                                }
                                if (found)
                                    break;
                            }
                            if (found)
                                break;
                        }
                        if (!found) {
                            console.log(`⚠️ File not found in organization data, using fallback: ${fileName}`);
                            const fileNameWithoutExt = fileName.split('.')[0];
                            const registrationId = fileNameWithoutExt;
                            const docType = 'supporting';
                            if (!organizedFiles[registrationId]) {
                                organizedFiles[registrationId] = {};
                            }
                            if (!organizedFiles[registrationId][docType]) {
                                organizedFiles[registrationId][docType] = [];
                            }
                            organizedFiles[registrationId][docType].push(file);
                        }
                    }
                }
                catch (parseError) {
                    console.error('Error parsing organization data:', parseError);
                    organizedFiles = DocumentController.fallbackFileOrganization(files);
                }
            }
            else {
                organizedFiles = DocumentController.fallbackFileOrganization(files);
            }
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const results = [];
            const errors = [];
            let totalProcessed = 0;
            let totalSuccessful = 0;
            for (const [registrationId, studentDocs] of Object.entries(organizedFiles)) {
                try {
                    const student = await prisma.student.findFirst({
                        where: { registrationId: registrationId }
                    });
                    if (!student) {
                        errors.push(`Student with registration ID '${registrationId}' not found`);
                        continue;
                    }
                    for (const [docType, docFiles] of Object.entries(studentDocs)) {
                        for (const file of docFiles) {
                            try {
                                totalProcessed++;
                                const existingDoc = await prisma.document.findFirst({
                                    where: {
                                        registrationId: student.id,
                                        documentType: docType.toUpperCase()
                                    }
                                });
                                let document;
                                let action = 'created';
                                if (existingDoc) {
                                    console.log(`🔄 Replacing existing ${docType} document for ${registrationId}`);
                                    try {
                                        await documentService.deleteDocument(existingDoc.id);
                                    }
                                    catch (deleteError) {
                                        console.error('Error deleting old document:', deleteError);
                                    }
                                    document = await documentService.uploadDocument(file, {
                                        studentId: student.id,
                                        registrationId: registrationId,
                                        documentType: docType.toUpperCase(),
                                        fileName: file.originalname,
                                        fileSize: file.size
                                    });
                                    action = 'replaced';
                                }
                                else {
                                    document = await documentService.uploadDocument(file, {
                                        studentId: student.id,
                                        registrationId: registrationId,
                                        documentType: docType.toUpperCase(),
                                        fileName: file.originalname,
                                        fileSize: file.size
                                    });
                                }
                                results.push({
                                    registrationId,
                                    documentType: docType,
                                    fileName: file.originalname,
                                    documentId: document.id,
                                    status: 'success',
                                    action: action
                                });
                                totalSuccessful++;
                            }
                            catch (fileError) {
                                errors.push(`Failed to upload ${file.originalname} for ${registrationId}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
                            }
                        }
                    }
                }
                catch (studentError) {
                    errors.push(`Error processing documents for ${registrationId}: ${studentError instanceof Error ? studentError.message : 'Unknown error'}`);
                }
            }
            res.status(201).json({
                success: totalSuccessful > 0,
                summary: {
                    totalProcessed,
                    totalSuccessful,
                    totalErrors: errors.length,
                    studentsProcessed: Object.keys(organizedFiles).length
                },
                results,
                errors: errors.length > 0 ? errors : undefined
            });
        }
        catch (error) {
            console.error('Bulk document upload error:', error);
            next(error);
        }
    }
    static fallbackFileOrganization(files) {
        var _a;
        const organizedFiles = {};
        for (const file of files) {
            try {
                const fileName = file.originalname || file.name || 'unknown';
                const fileNameWithoutExt = fileName.split('.')[0];
                const registrationId = fileNameWithoutExt;
                const fileExtension = (_a = fileName.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                let docType = 'supporting';
                if (fileName.toLowerCase().includes('photo') || fileName.toLowerCase().includes('picture') ||
                    ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
                    docType = 'photo';
                }
                else if (fileName.toLowerCase().includes('certificate') || fileName.toLowerCase().includes('cert')) {
                    docType = 'certificate';
                }
                else if (fileName.toLowerCase().includes('transcript') || fileName.toLowerCase().includes('grade')) {
                    docType = 'transcript';
                }
                if (!organizedFiles[registrationId]) {
                    organizedFiles[registrationId] = {};
                }
                if (!organizedFiles[registrationId][docType]) {
                    organizedFiles[registrationId][docType] = [];
                }
                organizedFiles[registrationId][docType].push(file);
            }
            catch (fileError) {
                console.error('Error organizing file:', file.originalname, fileError);
            }
        }
        return organizedFiles;
    }
    static async getDocumentById(req, res, next) {
        try {
            const { id } = req.params;
            const document = await documentService.getDocumentById(Number(id));
            if (!document) {
                throw new errorHandler_1.AppError('Document not found', 404);
            }
            res.json(document);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateDocument(req, res, next) {
        try {
            const { id } = req.params;
            const { fileName, documentType } = req.body;
            const document = await documentService.updateDocument(Number(id), {
                fileName,
                documentType
            });
            res.json(document);
        }
        catch (error) {
            next(error);
        }
    }
    static async downloadDocument(req, res, next) {
        try {
            const { id } = req.params;
            const document = await documentService.getDocumentById(Number(id));
            if (!document) {
                throw new errorHandler_1.AppError('Document not found', 404);
            }
            const useProxy = DocumentController.shouldUseProxy(document);
            if (useProxy) {
                await DocumentController.proxyDownload(document, res);
            }
            else {
                await DocumentController.presignedDownload(document, res);
            }
        }
        catch (error) {
            console.error('Document download error:', error);
            if (!res.headersSent) {
                try {
                    const document = await documentService.getDocumentById(Number(req.params.id));
                    if (document) {
                        await DocumentController.proxyDownload(document, res);
                        return;
                    }
                }
                catch (fallbackError) {
                    console.error('Fallback download failed:', fallbackError);
                }
            }
            next(error);
        }
    }
    static shouldUseProxy(document) {
        if (process.env.CLOUD_STORAGE_FORCE_PROXY === 'true')
            return true;
        if (process.env.CLOUD_STORAGE_FORCE_PRESIGNED === 'true')
            return false;
        const fileSizeThreshold = parseInt(process.env.PROXY_FILE_SIZE_THRESHOLD || '10485760');
        if (document.fileSize && document.fileSize > fileSizeThreshold) {
            return false;
        }
        const sensitiveTypes = ['TRANSCRIPT', 'CERTIFICATE'];
        if (sensitiveTypes.includes(document.documentType)) {
            return true;
        }
        return true;
    }
    static async presignedDownload(document, res) {
        const { generatePresignedUrl, extractKeyFromUrl } = await Promise.resolve().then(() => __importStar(require('../config/storage')));
        const storageKey = document.fileUrl.startsWith('documents/')
            ? document.fileUrl
            : extractKeyFromUrl(document.fileUrl);
        const presignedUrl = await generatePresignedUrl(storageKey, 3600);
        res.json({
            url: presignedUrl,
            fileName: document.fileName,
            contentType: document.fileType || 'application/octet-stream',
            expiresIn: 3600,
            method: 'presigned'
        });
    }
    static async proxyDownload(document, res) {
        const { GetObjectCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-s3')));
        const { storageClient, STORAGE_BUCKET_NAME, extractKeyFromUrl } = await Promise.resolve().then(() => __importStar(require('../config/storage')));
        const storageKey = document.fileUrl.startsWith('documents/')
            ? document.fileUrl
            : extractKeyFromUrl(document.fileUrl);
        const getCommand = new GetObjectCommand({
            Bucket: STORAGE_BUCKET_NAME,
            Key: storageKey
        });
        const response = await storageClient.send(getCommand);
        if (!response.Body) {
            throw new errorHandler_1.AppError('File content not found', 404);
        }
        res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
        res.setHeader('Content-Length', response.ContentLength || 0);
        res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.setHeader('X-Download-Method', 'proxy');
        if (response.Body instanceof Uint8Array) {
            res.send(Buffer.from(response.Body));
        }
        else {
            const stream = response.Body;
            stream.on('error', (error) => {
                console.error('Stream error:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Stream error' });
                }
            });
            stream.pipe(res);
        }
    }
    static async deleteDocument(req, res, next) {
        try {
            const { id } = req.params;
            await documentService.deleteDocument(Number(id));
            res.json({ message: 'Document deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DocumentController = DocumentController;
//# sourceMappingURL=document.controller.js.map