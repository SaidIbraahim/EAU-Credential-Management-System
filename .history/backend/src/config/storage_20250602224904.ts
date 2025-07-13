import { S3Client } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config();

if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
  throw new Error('Missing R2 configuration in environment variables');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME; 