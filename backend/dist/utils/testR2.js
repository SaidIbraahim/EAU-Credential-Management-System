"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testR2Connection = testR2Connection;
exports.listR2Documents = listR2Documents;
const client_s3_1 = require("@aws-sdk/client-s3");
const storage_1 = require("../config/storage");
const logger_1 = require("./logger");
async function testR2Connection() {
    try {
        logger_1.logger.info('Testing R2 connection...');
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket: storage_1.BUCKET_NAME,
            MaxKeys: 1
        });
        const response = await storage_1.r2Client.send(command);
        logger_1.logger.info(`R2 connection successful! Bucket: ${storage_1.BUCKET_NAME}`);
        logger_1.logger.info(`Found ${response.KeyCount || 0} objects in bucket`);
        return true;
    }
    catch (error) {
        logger_1.logger.error('R2 connection failed:', error);
        return false;
    }
}
async function listR2Documents() {
    try {
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket: storage_1.BUCKET_NAME,
            Prefix: 'documents/'
        });
        const response = await storage_1.r2Client.send(command);
        if (response.Contents && response.Contents.length > 0) {
            logger_1.logger.info(`Found ${response.Contents.length} documents in R2:`);
            response.Contents.forEach(obj => {
                logger_1.logger.info(`- ${obj.Key} (${obj.Size} bytes)`);
            });
        }
        else {
            logger_1.logger.info('No documents found in R2');
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to list R2 documents:', error);
    }
}
//# sourceMappingURL=testR2.js.map