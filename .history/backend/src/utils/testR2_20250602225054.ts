import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client, BUCKET_NAME } from '../config/storage';
import { logger } from './logger';

export async function testR2Connection(): Promise<boolean> {
  try {
    logger.info('Testing R2 connection...');
    
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1
    });

    const response = await r2Client.send(command);
    logger.info(`R2 connection successful! Bucket: ${BUCKET_NAME}`);
    logger.info(`Found ${response.KeyCount || 0} objects in bucket`);
    
    return true;
  } catch (error) {
    logger.error('R2 connection failed:', error);
    return false;
  }
}

// Function to list all documents in R2 (for debugging)
export async function listR2Documents(): Promise<void> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'documents/'
    });

    const response = await r2Client.send(command);
    
    if (response.Contents && response.Contents.length > 0) {
      logger.info(`Found ${response.Contents.length} documents in R2:`);
      response.Contents.forEach(obj => {
        logger.info(`- ${obj.Key} (${obj.Size} bytes)`);
      });
    } else {
      logger.info('No documents found in R2');
    }
  } catch (error) {
    logger.error('Failed to list R2 documents:', error);
  }
} 