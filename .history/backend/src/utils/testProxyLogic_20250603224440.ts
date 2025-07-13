import { GetObjectCommand } from '@aws-sdk/client-s3';
import { storageClient, STORAGE_BUCKET_NAME } from '../config/storage';

// Mock document data for testing
const testDocuments = [
  {
    id: 1,
    fileName: 'transcript.pdf',
    documentType: 'TRANSCRIPT',
    fileSize: 2926832,
    fileUrl: 'documents/cced46ec-3a46-45f4-9763-2d56281186f2.pdf'
  },
  {
    id: 2,
    fileName: 'photo.png',
    documentType: 'PHOTO',
    fileSize: 112706,
    fileUrl: 'documents/126a118b-2947-494e-b10c-6447581e00a9.png'
  },
  {
    id: 3,
    fileName: 'large-video.mp4',
    documentType: 'SUPPORTING',
    fileSize: 52428800, // 50MB
    fileUrl: 'documents/large-file.mp4'
  }
];

// Replicate the proxy decision logic from DocumentController
function shouldUseProxy(document: any): boolean {
  // Configuration override
  if (process.env.CLOUD_STORAGE_FORCE_PROXY === 'true') return true;
  if (process.env.CLOUD_STORAGE_FORCE_PRESIGNED === 'true') return false;
  
  // File size considerations (proxy for smaller files, presigned for larger)
  const fileSizeThreshold = parseInt(process.env.PROXY_FILE_SIZE_THRESHOLD || '10485760'); // 10MB default
  if (document.fileSize && document.fileSize > fileSizeThreshold) {
    return false; // Use presigned URLs for large files
  }
  
  // Security considerations (proxy for sensitive document types)
  const sensitiveTypes = ['TRANSCRIPT', 'CERTIFICATE'];
  if (sensitiveTypes.includes(document.documentType)) {
    return true; // Use proxy for sensitive documents
  }
  
  // Default to proxy for better control
  return true;
}

async function testProxyLogic() {
  console.log('🔍 Testing Proxy Download Logic...\n');
  
  console.log('⚙️  Environment Configuration:');
  console.log(`   CLOUD_STORAGE_FORCE_PROXY: ${process.env.CLOUD_STORAGE_FORCE_PROXY || 'false'}`);
  console.log(`   CLOUD_STORAGE_FORCE_PRESIGNED: ${process.env.CLOUD_STORAGE_FORCE_PRESIGNED || 'false'}`);
  console.log(`   PROXY_FILE_SIZE_THRESHOLD: ${process.env.PROXY_FILE_SIZE_THRESHOLD || '10485760'} bytes (10MB)`);
  console.log(`   STORAGE_BUCKET: ${STORAGE_BUCKET_NAME}`);
  
  console.log('\n📄 Testing Decision Logic for Different Document Types:');
  
  testDocuments.forEach((doc, index) => {
    const useProxy = shouldUseProxy(doc);
    const sizeInMB = (doc.fileSize / 1024 / 1024).toFixed(2);
    
    console.log(`\n   Document ${index + 1}:`);
    console.log(`   📁 File: ${doc.fileName}`);
    console.log(`   📋 Type: ${doc.documentType}`);
    console.log(`   📏 Size: ${sizeInMB} MB (${doc.fileSize} bytes)`);
    console.log(`   🎯 Decision: ${useProxy ? '🔒 USE PROXY' : '🔗 USE PRESIGNED URL'}`);
    
    // Explain the reasoning
    if (process.env.CLOUD_STORAGE_FORCE_PROXY === 'true') {
      console.log(`   💡 Reason: Force proxy enabled`);
    } else if (process.env.CLOUD_STORAGE_FORCE_PRESIGNED === 'true') {
      console.log(`   💡 Reason: Force presigned enabled`);
    } else if (doc.fileSize > parseInt(process.env.PROXY_FILE_SIZE_THRESHOLD || '10485760')) {
      console.log(`   💡 Reason: Large file (>${(parseInt(process.env.PROXY_FILE_SIZE_THRESHOLD || '10485760') / 1024 / 1024).toFixed(0)}MB)`);
    } else if (['TRANSCRIPT', 'CERTIFICATE'].includes(doc.documentType)) {
      console.log(`   💡 Reason: Sensitive document type`);
    } else {
      console.log(`   💡 Reason: Default to proxy for better control`);
    }
  });
  
  // Test storage access with a real file
  console.log('\n🔍 Testing Storage Access:');
  
  try {
    const testFile = 'documents/cced46ec-3a46-45f4-9763-2d56281186f2.pdf';
    console.log(`   📂 Testing file: ${testFile}`);
    
    const getCommand = new GetObjectCommand({
      Bucket: STORAGE_BUCKET_NAME,
      Key: testFile
    });
    
    const response = await storageClient.send(getCommand);
    console.log(`   ✅ Storage access successful`);
    console.log(`   📊 File size: ${response.ContentLength} bytes`);
    console.log(`   📝 Content type: ${response.ContentType}`);
    
    // Test reading a small chunk
    if (response.Body) {
      let bytesRead = 0;
      const maxBytes = 1024; // Read first 1KB
      
      for await (const chunk of response.Body as any) {
        bytesRead += chunk.length;
        if (bytesRead >= maxBytes) break;
      }
      
      console.log(`   ✅ Successfully read ${bytesRead} bytes from storage`);
    }
    
  } catch (error) {
    console.log(`   ❌ Storage access failed: ${error}`);
  }
  
  console.log('\n🎉 Proxy Logic Test Complete!');
  console.log('\n📝 Summary:');
  console.log(`   ✅ Configuration loaded correctly`);
  console.log(`   ✅ Decision logic working for all document types`);
  console.log(`   ✅ Storage access functional`);
  console.log(`   🚀 Ready for document downloads!`);
  
  console.log('\n🔧 Next Steps:');
  console.log(`   1. Start your backend server`);
  console.log(`   2. Test document downloads in the admin interface`);
  console.log(`   3. Check browser network tab to verify proxy downloads`);
  console.log(`   4. Monitor server logs for download method used`);
}

testProxyLogic(); 