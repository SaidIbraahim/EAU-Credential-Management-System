import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config();

// Generic cloud storage configuration
// Currently configured for Cloudflare R2, but can be easily switched to AWS S3, Google Cloud Storage, etc.
if (!process.env.CLOUD_STORAGE_ENDPOINT || !process.env.CLOUD_STORAGE_ACCESS_KEY_ID || !process.env.CLOUD_STORAGE_SECRET_ACCESS_KEY || !process.env.CLOUD_STORAGE_BUCKET_NAME) {
  throw new Error('Missing cloud storage configuration in environment variables. Please check CLOUD_STORAGE_* variables.');
}

// Trim credentials to remove any accidental whitespace
const accessKeyId = process.env.CLOUD_STORAGE_ACCESS_KEY_ID.trim();
const secretAccessKey = process.env.CLOUD_STORAGE_SECRET_ACCESS_KEY.trim();

// Validate access key length (32 for R2/S3, may vary for other providers)
if (accessKeyId.length !== 32) {
  throw new Error(`Cloud Storage Access Key ID has invalid length: ${accessKeyId.length}, expected 32 characters`);
}

// Validate secret access key length (64 for R2/S3, may vary for other providers)
if (secretAccessKey.length !== 64) {
  throw new Error(`Cloud Storage Secret Access Key has invalid length: ${secretAccessKey.length}, expected 64 characters`);
}

// S3-compatible client (works with R2, AWS S3, MinIO, etc.)
export const storageClient = new S3Client({
  region: process.env.CLOUD_STORAGE_REGION || 'auto', // 'auto' for R2, specific region for AWS
  endpoint: process.env.CLOUD_STORAGE_ENDPOINT.trim(),
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  },
  // Force path-style addressing for compatibility with different providers
  forcePathStyle: process.env.CLOUD_STORAGE_FORCE_PATH_STYLE === 'true'
});

export const STORAGE_BUCKET_NAME = process.env.CLOUD_STORAGE_BUCKET_NAME.trim();
export const STORAGE_PROVIDER = process.env.CLOUD_STORAGE_PROVIDER || 'cloudflare-r2';

// Generate presigned URL for secure access (recommended for private buckets)
export async function generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: STORAGE_BUCKET_NAME,
      Key: key
    });
    
    const presignedUrl = await getSignedUrl(storageClient, command, { 
      expiresIn // URL expires in seconds (default: 1 hour)
    });
    
    return presignedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate secure access URL');
  }
}

// Provider-specific URL generation (for public buckets only)
export function generateFileUrl(key: string): string {
  const customDomain = process.env.CLOUD_STORAGE_PUBLIC_DOMAIN;
  
  if (customDomain) {
    return `https://${customDomain}/${key}`;
  }
  
  // Default URL patterns for different providers
  switch (STORAGE_PROVIDER.toLowerCase()) {
    case 'aws-s3':
      const region = process.env.CLOUD_STORAGE_REGION || 'us-east-1';
      return `https://${STORAGE_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    
    case 'cloudflare-r2':
      return `https://${STORAGE_BUCKET_NAME}.r2.dev/${key}`;
    
    case 'google-cloud':
      return `https://storage.googleapis.com/${STORAGE_BUCKET_NAME}/${key}`;
    
    case 'minio':
    case 'custom':
      // For MinIO or custom S3-compatible storage
      const endpoint = process.env.CLOUD_STORAGE_ENDPOINT?.replace('https://', '').replace('http://', '');
      return `https://${endpoint}/${STORAGE_BUCKET_NAME}/${key}`;
    
    default:
      // Fallback to generic S3-style URL
      return `https://${STORAGE_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  }
}

// Extract storage key from URL (reverse of generateFileUrl)
export function extractKeyFromUrl(url: string): string {
  const customDomain = process.env.CLOUD_STORAGE_PUBLIC_DOMAIN;
  
  if (customDomain) {
    return url.replace(`https://${customDomain}/`, '');
  }
  
  // Handle different URL patterns
  switch (STORAGE_PROVIDER.toLowerCase()) {
    case 'aws-s3':
      const s3Pattern = new RegExp(`https://${STORAGE_BUCKET_NAME}\\.s3\\.[^.]+\\.amazonaws\\.com/(.+)`);
      const s3Match = url.match(s3Pattern);
      return s3Match ? s3Match[1] : url;
    
    case 'cloudflare-r2':
      return url.replace(`https://${STORAGE_BUCKET_NAME}.r2.dev/`, '');
    
    case 'google-cloud':
      return url.replace(`https://storage.googleapis.com/${STORAGE_BUCKET_NAME}/`, '');
    
    default:
      // Generic fallback - try to extract everything after the last /bucket-name/
      const genericPattern = new RegExp(`/${STORAGE_BUCKET_NAME}/(.+)`);
      const genericMatch = url.match(genericPattern);
      return genericMatch ? genericMatch[1] : url;
  }
} 