"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocuments = exports.upload = exports.DOCUMENT_TYPES = void 0;
exports.uploadToCloudStorage = uploadToCloudStorage;
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const storage_1 = require("../config/storage");
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
exports.DOCUMENT_TYPES = {
    photo: {
        allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
        maxSize: 5 * 1024 * 1024,
        maxCount: 1,
        extensions: ['.jpg', '.jpeg', '.png']
    },
    transcript: {
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 10 * 1024 * 1024,
        maxCount: 1,
        extensions: ['.pdf', '.jpg', '.jpeg', '.png']
    },
    certificate: {
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 10 * 1024 * 1024,
        maxCount: 1,
        extensions: ['.pdf', '.jpg', '.jpeg', '.png']
    },
    supporting: {
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSize: 10 * 1024 * 1024,
        maxCount: 5,
        extensions: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
    }
};
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            console.warn(`Rejected file type: ${file.mimetype} for file: ${file.originalname}`);
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    }
});
exports.upload = upload;
async function uploadToCloudStorage(file) {
    try {
        const fileName = file.originalname || file.name || 'unknown-file';
        const fileExtension = path_1.default.extname(fileName || '');
        const uniqueKey = `documents/${(0, crypto_1.randomUUID)()}${fileExtension}`;
        console.log(`Uploading file to cloud storage: ${fileName} (${file.size} bytes)`, {
            hasOriginalName: !!file.originalname,
            hasName: !!file.name,
            hasBuffer: !!file.buffer,
            fileKeys: Object.keys(file)
        });
        const putCommand = new client_s3_1.PutObjectCommand({
            Bucket: storage_1.STORAGE_BUCKET_NAME,
            Key: uniqueKey,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: {
                originalName: fileName,
                uploadDate: new Date().toISOString()
            }
        });
        await storage_1.storageClient.send(putCommand);
        const fileUrl = (0, storage_1.generateFileUrl)(uniqueKey);
        console.log(`File uploaded successfully: ${fileUrl}`);
        return {
            key: uniqueKey,
            url: fileUrl,
            originalName: fileName,
            size: file.size,
            mimetype: file.mimetype
        };
    }
    catch (error) {
        console.error('Cloud storage upload failed:', error);
        throw new Error(`Failed to upload file to cloud storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
const uploadDocuments = (req, res, next) => {
    const documentType = req.params.documentType;
    if (!exports.DOCUMENT_TYPES[documentType]) {
        return res.status(400).json({ error: 'Invalid document type' });
    }
    const maxCount = exports.DOCUMENT_TYPES[documentType].maxCount;
    const uploadMiddleware = upload.array('files', maxCount);
    uploadMiddleware(req, res, next);
};
exports.uploadDocuments = uploadDocuments;
//# sourceMappingURL=upload.js.map