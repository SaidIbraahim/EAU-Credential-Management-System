import { S3Client } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config();

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: 'https://1bb504c3641fdc55c778795f5c49af61.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '6ed1cf8c23e8797a9f0738b61162303',
    secretAccessKey: '399be963e37ee70b2a78bab9e204b53135a765946bc9565edfaea26d3d13a405'
  }
});

export const BUCKET_NAME = 'eau-credentials'; 