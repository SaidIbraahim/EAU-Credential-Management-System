# Cloudflare R2 Storage Setup Guide

## Environment Variables Required

Add these to your `.env` file in the backend root directory:

```env
# Cloudflare R2 Configuration
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_DOMAIN=your-bucket-name.r2.dev  # Optional: for custom domain
```

## Getting R2 Credentials

1. **Log into Cloudflare Dashboard**
   - Go to R2 Object Storage section
   - Create a bucket if you haven't already

2. **Create R2 API Token**
   - Go to "Manage R2 API Tokens"
   - Click "Create API Token"
   - Give it appropriate permissions (Object Read, Object Write, Object Delete)
   - Copy the Access Key ID and Secret Access Key

3. **Get R2 Endpoint**
   - Format: `https://your-account-id.r2.cloudflarestorage.com`
   - Find your account ID in the right sidebar of your Cloudflare dashboard

## R2 Bucket Configuration

### Option 1: Public Bucket (Recommended for documents)
1. In your R2 bucket settings, enable "Public Access"
2. Set up custom domain (optional but recommended)
3. Files will be accessible via: `https://your-bucket.r2.dev/path`

### Option 2: Private Bucket (More Secure)
1. Keep bucket private
2. Files will be served through your backend with presigned URLs
3. Requires implementing presigned URL generation (not included in current setup)

## Testing the Setup

1. **Start your backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Check server logs for R2 connection test**
   - Look for "R2 connection successful!" message
   - If failed, check your environment variables

3. **Test via API endpoint** (requires authentication)
   ```bash
   curl -H "Authorization: Bearer your-jwt-token" \
        http://localhost:3000/api/documents/debug/r2-test
   ```

## File Structure in R2

Documents will be organized as:
```
documents/
├── {student-registration-id}/
│   ├── photo/
│   │   └── timestamp-random-filename.jpg
│   ├── transcript/
│   │   └── timestamp-random-filename.pdf
│   ├── certificate/
│   │   └── timestamp-random-filename.pdf
│   └── supporting/
│       └── timestamp-random-filename.pdf
```

## Troubleshooting

### Common Issues:

1. **"Missing R2 configuration" error**
   - Check all environment variables are set
   - Restart the server after adding variables

2. **"Access Denied" errors**
   - Verify API token has correct permissions
   - Check bucket permissions

3. **"Bucket not found" error**
   - Verify bucket name is correct
   - Ensure bucket exists in your Cloudflare account

4. **Files not accessible via URL**
   - Check if bucket has public access enabled
   - Verify the R2_PUBLIC_DOMAIN setting
   - Consider using custom domain for better performance

### Debug Mode:

The system includes debug endpoints:
- `/api/documents/debug/r2-test` - Test R2 connection and list files
- Check server logs for detailed R2 operation information

## Security Notes

- Keep your R2 credentials secure
- Consider using environment-specific buckets (dev, staging, prod)
- For production, consider implementing presigned URLs for private access
- Monitor R2 usage in Cloudflare dashboard

## Migration from Local Storage

If you have existing local files, you'll need to:
1. Upload existing files to R2
2. Update database records with new R2 URLs
3. Clean up local storage

The system no longer uses local file storage once R2 is configured. 