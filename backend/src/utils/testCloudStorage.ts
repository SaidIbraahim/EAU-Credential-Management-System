import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { storageClient, STORAGE_BUCKET_NAME, STORAGE_PROVIDER } from '../config/storage';
import { logger } from './logger';

export async function testCloudStorageConnection(): Promise<boolean> {
  try {
    logger.info(`Testing ${STORAGE_PROVIDER} connection...`);
    
    // Test connection by listing objects (with minimal limit)
    const command = new ListObjectsV2Command({
      Bucket: STORAGE_BUCKET_NAME,
      MaxKeys: 1 // Only fetch 1 object to minimize bandwidth
    });

    await storageClient.send(command);
    
    logger.info(`✅ ${STORAGE_PROVIDER} connection successful`);
    return true;
  } catch (error: any) {
    logger.error(`❌ ${STORAGE_PROVIDER} connection failed:`, {
      name: error.name,
      message: error.message,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
      stack: error.stack
    });
    
    // Log helpful debugging information
    logger.info('Cloud Storage Configuration Check:');
    logger.info(`- Provider: ${STORAGE_PROVIDER}`);
    logger.info(`- Bucket: ${STORAGE_BUCKET_NAME}`);
    logger.info(`- Endpoint: ${process.env.CLOUD_STORAGE_ENDPOINT ? 'Set' : 'Not set'}`);
    logger.info(`- Access Key: ${process.env.CLOUD_STORAGE_ACCESS_KEY_ID ? 'Set' : 'Not set'}`);
    logger.info(`- Secret Key: ${process.env.CLOUD_STORAGE_SECRET_ACCESS_KEY ? 'Set' : 'Not set'}`);
    
    return false;
  }
} 