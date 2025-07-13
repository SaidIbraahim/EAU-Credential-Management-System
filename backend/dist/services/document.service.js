"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const storage_1 = require("../config/storage");
const upload_1 = require("../middleware/upload");
const prisma = new client_1.PrismaClient();
class DocumentService {
    async uploadDocument(file, documentData) {
        try {
            const uploadResult = await (0, upload_1.uploadToCloudStorage)(file);
            const storageKey = uploadResult.key;
            const document = await prisma.document.create({
                data: {
                    registrationId: documentData.studentId,
                    documentType: documentData.documentType,
                    fileName: uploadResult.originalName,
                    fileUrl: storageKey,
                    fileSize: uploadResult.size,
                    uploadDate: new Date()
                },
                include: {
                    student: true
                }
            });
            return document;
        }
        catch (error) {
            console.error('Error uploading document:', error);
            throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async uploadDocumentsParallel(files, studentId, registrationId, documentType) {
        try {
            console.time(`⚡ Parallel Upload ${files.length} files for ${registrationId}`);
            const uploadPromises = files.map(file => (0, upload_1.uploadToCloudStorage)(file));
            const uploadResults = await Promise.all(uploadPromises);
            console.log(`✅ Cloud uploads completed for ${files.length} files for student ${registrationId}`);
            const documentData = uploadResults.map((result) => ({
                registrationId: studentId,
                documentType: documentType,
                fileName: result.originalName,
                fileUrl: result.key,
                fileSize: result.size,
                uploadDate: new Date()
            }));
            const documents = await prisma.$transaction(documentData.map(data => prisma.document.create({
                data,
                include: { student: true }
            })));
            console.timeEnd(`⚡ Parallel Upload ${files.length} files for ${registrationId}`);
            console.log(`🚀 Performance: Uploaded ${files.length} files in parallel for ${registrationId}!`);
            return documents;
        }
        catch (error) {
            console.error(`Error in parallel upload for ${registrationId}:`, error);
            throw new Error(`Failed to upload documents in parallel: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async addPresignedUrls(documents) {
        const documentsWithUrls = await Promise.all(documents.map(async (doc) => {
            try {
                let storageKey = doc.fileUrl;
                if (doc.fileUrl.startsWith('http')) {
                    storageKey = (0, storage_1.extractKeyFromUrl)(doc.fileUrl);
                    console.log(`Extracted key from URL: ${doc.fileUrl} -> ${storageKey}`);
                }
                const presignedUrl = await (0, storage_1.generatePresignedUrl)(storageKey, 3600);
                console.log(`Generated presigned URL for document ${doc.id}: ${presignedUrl}`);
                return {
                    ...doc,
                    presignedUrl
                };
            }
            catch (error) {
                console.error(`Error generating presigned URL for document ${doc.id}:`, error);
                console.error(`File URL: ${doc.fileUrl}`);
                return {
                    ...doc,
                    presignedUrl: undefined
                };
            }
        }));
        return documentsWithUrls;
    }
    async deleteDocument(id) {
        try {
            const document = await prisma.document.findUnique({
                where: { id }
            });
            if (!document) {
                throw new Error('Document not found');
            }
            const storageKey = document.fileUrl.startsWith('documents/')
                ? document.fileUrl
                : (0, storage_1.extractKeyFromUrl)(document.fileUrl);
            const deleteCommand = new client_s3_1.DeleteObjectCommand({
                Bucket: storage_1.STORAGE_BUCKET_NAME,
                Key: storageKey
            });
            await storage_1.storageClient.send(deleteCommand);
            await prisma.document.delete({
                where: { id }
            });
        }
        catch (error) {
            console.error('Error deleting document:', error);
            throw new Error('Failed to delete document');
        }
    }
    async getDocumentsByStudentId(studentId) {
        const documents = await prisma.document.findMany({
            where: { registrationId: studentId },
            include: {
                student: true
            },
            orderBy: { uploadDate: 'desc' }
        });
        return this.addPresignedUrls(documents);
    }
    async getDocumentsByRegistrationId(registrationId) {
        const documents = await prisma.document.findMany({
            where: {
                student: {
                    registrationId: registrationId
                }
            },
            include: {
                student: true
            },
            orderBy: { uploadDate: 'desc' }
        });
        return this.addPresignedUrls(documents);
    }
    async getDocumentById(id) {
        const document = await prisma.document.findUnique({
            where: { id },
            include: {
                student: true
            }
        });
        if (!document)
            return null;
        const documentsWithUrls = await this.addPresignedUrls([document]);
        return documentsWithUrls[0];
    }
    async updateDocument(id, updateData) {
        return await prisma.document.update({
            where: { id },
            data: updateData,
            include: {
                student: true
            }
        });
    }
    async getAllDocuments(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [documents, total] = await Promise.all([
            prisma.document.findMany({
                skip,
                take: limit,
                include: {
                    student: true
                },
                orderBy: { uploadDate: 'desc' }
            }),
            prisma.document.count()
        ]);
        const documentsWithUrls = await this.addPresignedUrls(documents);
        return { documents: documentsWithUrls, total };
    }
}
exports.DocumentService = DocumentService;
//# sourceMappingURL=document.service.js.map