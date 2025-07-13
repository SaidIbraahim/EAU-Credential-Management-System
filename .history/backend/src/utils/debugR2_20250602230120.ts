import { config } from 'dotenv';
import { logger } from './logger';

config();

export function debugR2Config(): void {
  logger.info('=== R2 Configuration Debug ===');
  
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  
  logger.info(`R2_ENDPOINT: ${endpoint ? 'SET' : 'NOT SET'}`);
  logger.info(`R2_ACCESS_KEY_ID: ${accessKeyId ? 'SET' : 'NOT SET'}`);
  logger.info(`R2_SECRET_ACCESS_KEY: ${secretAccessKey ? 'SET' : 'NOT SET'}`);
  logger.info(`R2_BUCKET_NAME: ${bucketName ? 'SET' : 'NOT SET'}`);
  
  if (endpoint) {
    logger.info(`Endpoint length: ${endpoint.length}`);
    logger.info(`Endpoint starts with: ${endpoint.substring(0, 20)}...`);
  }
  
  if (accessKeyId) {
    const trimmed = accessKeyId.trim();
    logger.info(`Access Key ID length: ${accessKeyId.length} (trimmed: ${trimmed.length})`);
    logger.info(`Access Key ID starts with: ${accessKeyId.substring(0, 8)}...`);
    logger.info(`Has leading/trailing spaces: ${accessKeyId !== trimmed}`);
  }
  
  if (secretAccessKey) {
    const trimmed = secretAccessKey.trim();
    logger.info(`Secret Access Key length: ${secretAccessKey.length} (trimmed: ${trimmed.length})`);
    logger.info(`Secret starts with: ${secretAccessKey.substring(0, 8)}...`);
    logger.info(`Has leading/trailing spaces: ${secretAccessKey !== trimmed}`);
  }
  
  if (bucketName) {
    const trimmed = bucketName.trim();
    logger.info(`Bucket name: ${bucketName}`);
    logger.info(`Has leading/trailing spaces: ${bucketName !== trimmed}`);
  }
  
  logger.info('=== End R2 Debug ===');
} 