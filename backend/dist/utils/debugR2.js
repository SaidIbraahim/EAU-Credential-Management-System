"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugR2Config = debugR2Config;
const dotenv_1 = require("dotenv");
const logger_1 = require("./logger");
(0, dotenv_1.config)();
function debugR2Config() {
    logger_1.logger.info('=== R2 Configuration Debug ===');
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    logger_1.logger.info(`R2_ENDPOINT: ${endpoint ? 'SET' : 'NOT SET'}`);
    logger_1.logger.info(`R2_ACCESS_KEY_ID: ${accessKeyId ? 'SET' : 'NOT SET'}`);
    logger_1.logger.info(`R2_SECRET_ACCESS_KEY: ${secretAccessKey ? 'SET' : 'NOT SET'}`);
    logger_1.logger.info(`R2_BUCKET_NAME: ${bucketName ? 'SET' : 'NOT SET'}`);
    if (endpoint) {
        logger_1.logger.info(`Endpoint length: ${endpoint.length}`);
        logger_1.logger.info(`Endpoint starts with: ${endpoint.substring(0, 20)}...`);
    }
    if (accessKeyId) {
        const trimmed = accessKeyId.trim();
        logger_1.logger.info(`Access Key ID length: ${accessKeyId.length} (trimmed: ${trimmed.length})`);
        logger_1.logger.info(`Access Key ID starts with: ${accessKeyId.substring(0, 8)}...`);
        logger_1.logger.info(`Has leading/trailing spaces: ${accessKeyId !== trimmed}`);
    }
    if (secretAccessKey) {
        const trimmed = secretAccessKey.trim();
        logger_1.logger.info(`Secret Access Key length: ${secretAccessKey.length} (trimmed: ${trimmed.length})`);
        logger_1.logger.info(`Secret starts with: ${secretAccessKey.substring(0, 8)}...`);
        logger_1.logger.info(`Has leading/trailing spaces: ${secretAccessKey !== trimmed}`);
    }
    if (bucketName) {
        const trimmed = bucketName.trim();
        logger_1.logger.info(`Bucket name: ${bucketName}`);
        logger_1.logger.info(`Has leading/trailing spaces: ${bucketName !== trimmed}`);
    }
    logger_1.logger.info('=== End R2 Debug ===');
}
//# sourceMappingURL=debugR2.js.map