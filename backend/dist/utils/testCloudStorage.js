"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testCloudStorageConnection = testCloudStorageConnection;
const client_s3_1 = require("@aws-sdk/client-s3");
const storage_1 = require("../config/storage");
const logger_1 = require("./logger");
async function testCloudStorageConnection() {
    var _a;
    try {
        logger_1.logger.info(`Testing ${storage_1.STORAGE_PROVIDER} connection...`);
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket: storage_1.STORAGE_BUCKET_NAME,
            MaxKeys: 1
        });
        await storage_1.storageClient.send(command);
        logger_1.logger.info(`✅ ${storage_1.STORAGE_PROVIDER} connection successful`);
        return true;
    }
    catch (error) {
        logger_1.logger.error(`❌ ${storage_1.STORAGE_PROVIDER} connection failed:`, {
            name: error.name,
            message: error.message,
            code: error.Code,
            statusCode: (_a = error.$metadata) === null || _a === void 0 ? void 0 : _a.httpStatusCode,
            stack: error.stack
        });
        logger_1.logger.info('Cloud Storage Configuration Check:');
        logger_1.logger.info(`- Provider: ${storage_1.STORAGE_PROVIDER}`);
        logger_1.logger.info(`- Bucket: ${storage_1.STORAGE_BUCKET_NAME}`);
        logger_1.logger.info(`- Endpoint: ${process.env.CLOUD_STORAGE_ENDPOINT ? 'Set' : 'Not set'}`);
        logger_1.logger.info(`- Access Key: ${process.env.CLOUD_STORAGE_ACCESS_KEY_ID ? 'Set' : 'Not set'}`);
        logger_1.logger.info(`- Secret Key: ${process.env.CLOUD_STORAGE_SECRET_ACCESS_KEY ? 'Set' : 'Not set'}`);
        return false;
    }
}
//# sourceMappingURL=testCloudStorage.js.map