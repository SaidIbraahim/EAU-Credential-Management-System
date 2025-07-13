"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_PROVIDER = exports.STORAGE_BUCKET_NAME = exports.storageClient = void 0;
exports.generatePresignedUrl = generatePresignedUrl;
exports.generateFileUrl = generateFileUrl;
exports.extractKeyFromUrl = extractKeyFromUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_2 = require("@aws-sdk/client-s3");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
if (!process.env.CLOUD_STORAGE_ENDPOINT || !process.env.CLOUD_STORAGE_ACCESS_KEY_ID || !process.env.CLOUD_STORAGE_SECRET_ACCESS_KEY || !process.env.CLOUD_STORAGE_BUCKET_NAME) {
    throw new Error('Missing cloud storage configuration in environment variables. Please check CLOUD_STORAGE_* variables.');
}
const accessKeyId = process.env.CLOUD_STORAGE_ACCESS_KEY_ID.trim();
const secretAccessKey = process.env.CLOUD_STORAGE_SECRET_ACCESS_KEY.trim();
if (accessKeyId.length !== 32) {
    throw new Error(`Cloud Storage Access Key ID has invalid length: ${accessKeyId.length}, expected 32 characters`);
}
if (secretAccessKey.length !== 64) {
    throw new Error(`Cloud Storage Secret Access Key has invalid length: ${secretAccessKey.length}, expected 64 characters`);
}
exports.storageClient = new client_s3_1.S3Client({
    region: process.env.CLOUD_STORAGE_REGION || 'auto',
    endpoint: process.env.CLOUD_STORAGE_ENDPOINT.trim(),
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    },
    forcePathStyle: process.env.CLOUD_STORAGE_FORCE_PATH_STYLE === 'true'
});
exports.STORAGE_BUCKET_NAME = process.env.CLOUD_STORAGE_BUCKET_NAME.trim();
exports.STORAGE_PROVIDER = process.env.CLOUD_STORAGE_PROVIDER || 'cloudflare-r2';
async function generatePresignedUrl(key, expiresIn = 3600) {
    try {
        const command = new client_s3_2.GetObjectCommand({
            Bucket: exports.STORAGE_BUCKET_NAME,
            Key: key
        });
        const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(exports.storageClient, command, {
            expiresIn
        });
        return presignedUrl;
    }
    catch (error) {
        console.error('Error generating presigned URL:', error);
        throw new Error('Failed to generate secure access URL');
    }
}
function generateFileUrl(key) {
    var _a;
    const customDomain = process.env.CLOUD_STORAGE_PUBLIC_DOMAIN;
    if (customDomain) {
        return `https://${customDomain}/${key}`;
    }
    switch (exports.STORAGE_PROVIDER.toLowerCase()) {
        case 'aws-s3':
            const region = process.env.CLOUD_STORAGE_REGION || 'us-east-1';
            return `https://${exports.STORAGE_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
        case 'cloudflare-r2':
            return `https://${exports.STORAGE_BUCKET_NAME}.r2.dev/${key}`;
        case 'google-cloud':
            return `https://storage.googleapis.com/${exports.STORAGE_BUCKET_NAME}/${key}`;
        case 'minio':
        case 'custom':
            const endpoint = (_a = process.env.CLOUD_STORAGE_ENDPOINT) === null || _a === void 0 ? void 0 : _a.replace('https://', '').replace('http://', '');
            return `https://${endpoint}/${exports.STORAGE_BUCKET_NAME}/${key}`;
        default:
            return `https://${exports.STORAGE_BUCKET_NAME}.s3.amazonaws.com/${key}`;
    }
}
function extractKeyFromUrl(url) {
    const customDomain = process.env.CLOUD_STORAGE_PUBLIC_DOMAIN;
    if (customDomain) {
        return url.replace(`https://${customDomain}/`, '');
    }
    switch (exports.STORAGE_PROVIDER.toLowerCase()) {
        case 'aws-s3':
            const s3Pattern = new RegExp(`https://${exports.STORAGE_BUCKET_NAME}\\.s3\\.[^.]+\\.amazonaws\\.com/(.+)`);
            const s3Match = url.match(s3Pattern);
            return s3Match ? s3Match[1] : url;
        case 'cloudflare-r2':
            return url.replace(`https://${exports.STORAGE_BUCKET_NAME}.r2.dev/`, '');
        case 'google-cloud':
            return url.replace(`https://storage.googleapis.com/${exports.STORAGE_BUCKET_NAME}/`, '');
        default:
            const genericPattern = new RegExp(`/${exports.STORAGE_BUCKET_NAME}/(.+)`);
            const genericMatch = url.match(genericPattern);
            return genericMatch ? genericMatch[1] : url;
    }
}
//# sourceMappingURL=storage.js.map