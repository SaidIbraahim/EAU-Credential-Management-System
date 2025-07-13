import { S3Client } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config();

if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
  throw new Error('Missing R2 configuration in environment variables');
}

// Trim credentials to remove any accidental whitespace
const accessKeyId = process.env.R2_ACCESS_KEY_ID.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY.trim();

// Validate access key length
if (accessKeyId.length !== 32) {
  throw new Error(`R2 Access Key ID has invalid length: ${accessKeyId.length}, expected 32 characters`);
}

// Validate secret access key length (should be 64 characters)
if (secretAccessKey.length !== 64) {
  throw new Error(`R2 Secret Access Key has invalid length: ${secretAccessKey.length}, expected 64 characters`);
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT.trim(),
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  }
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME.trim(); 