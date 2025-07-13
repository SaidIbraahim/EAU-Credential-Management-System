import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { storageClient, STORAGE_BUCKET_NAME, generateFileUrl } from '../config/storage';

async function testCloudAccess() {
  console.log('🔍 Testing Cloud Storage Access...\n');
  
  try {
    // Test file keys from the database
    const testFiles = [
      'documents/cced46ec-3a46-45f4-9763-2d56281186f2.pdf',
      'documents/bb0560d8-8966-4332-a2f8-cd6a25b3776f.pdf',
      'documents/126a118b-2947-494e-b10c-6447581e00a9.png'
    ];
    
    console.log('📁 Testing file access for uploaded documents:');
    
    for (const key of testFiles) {
      console.log(`\n   Testing: ${key}`);
      
      // Test 1: Check if file exists using HeadObject
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: STORAGE_BUCKET_NAME,
          Key: key
        });
        
        const headResponse = await storageClient.send(headCommand);
        console.log(`   ✅ File exists - Size: ${headResponse.ContentLength} bytes`);
        console.log(`   📝 Content-Type: ${headResponse.ContentType}`);
        console.log(`   🕒 Last Modified: ${headResponse.LastModified}`);
        
        // Test 2: Generate public URL
        const publicUrl = generateFileUrl(key);
        console.log(`   🌐 Public URL: ${publicUrl}`);
        
        // Test 3: Try to get object metadata
        try {
          const getCommand = new GetObjectCommand({
            Bucket: STORAGE_BUCKET_NAME,
            Key: key
          });
          
          const getResponse = await storageClient.send(getCommand);
          console.log(`   ✅ Object accessible via SDK`);
          
          // Convert stream to buffer to check if content is readable
          if (getResponse.Body) {
            const chunks: Uint8Array[] = [];
            for await (const chunk of getResponse.Body as any) {
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            console.log(`   📊 Content size: ${buffer.length} bytes`);
          }
          
        } catch (getError) {
          console.log(`   ❌ SDK access failed: ${getError}`);
        }
        
        // Test 4: Test HTTP access using fetch
        try {
          console.log(`   🌐 Testing HTTP access...`);
          const response = await fetch(publicUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (response.ok) {
            console.log(`   ✅ HTTP HEAD successful - Status: ${response.status}`);
            console.log(`   📊 Content-Length: ${response.headers.get('content-length')}`);
            console.log(`   📝 Content-Type: ${response.headers.get('content-type')}`);
          } else {
            console.log(`   ❌ HTTP HEAD failed - Status: ${response.status} ${response.statusText}`);
            
            // Try to get error details
            try {
              const errorText = await response.text();
              console.log(`   📄 Error response: ${errorText}`);
            } catch {
              console.log(`   📄 Could not read error response`);
            }
          }
        } catch (httpError) {
          console.log(`   ❌ HTTP test failed: ${httpError}`);
        }
        
      } catch (headError) {
        console.log(`   ❌ File not found or inaccessible: ${headError}`);
      }
    }
    
    // Test 5: Check bucket configuration
    console.log('\n🔧 Bucket Configuration:');
    console.log(`   Bucket: ${STORAGE_BUCKET_NAME}`);
    console.log(`   Provider: ${process.env.CLOUD_STORAGE_PROVIDER}`);
    console.log(`   Endpoint: ${process.env.CLOUD_STORAGE_ENDPOINT}`);
    console.log(`   Public Domain: ${process.env.CLOUD_STORAGE_PUBLIC_DOMAIN || 'Not configured'}`);
    console.log(`   Force Path Style: ${process.env.CLOUD_STORAGE_FORCE_PATH_STYLE || 'false'}`);
    
  } catch (error) {
    console.error('❌ Cloud access test failed:', error);
  }
}

testCloudAccess(); 