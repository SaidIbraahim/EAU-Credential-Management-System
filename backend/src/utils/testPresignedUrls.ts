import { generatePresignedUrl } from '../config/storage';

async function testPresignedUrls() {
  console.log('🔍 Testing Presigned URL Generation...\n');
  
  try {
    // Test files from our earlier tests
    const testFiles = [
      'documents/cced46ec-3a46-45f4-9763-2d56281186f2.pdf',
      'documents/bb0560d8-8966-4332-a2f8-cd6a25b3776f.pdf',
      'documents/126a118b-2947-494e-b10c-6447581e00a9.png'
    ];
    
    console.log('🔗 Generating presigned URLs for test files:');
    
    for (const key of testFiles) {
      console.log(`\n   Testing: ${key}`);
      
      try {
        // Generate presigned URL
        const presignedUrl = await generatePresignedUrl(key, 3600); // 1 hour expiry
        console.log(`   ✅ Presigned URL generated successfully`);
        console.log(`   🌐 URL: ${presignedUrl.substring(0, 100)}...`);
        
        // Test the presigned URL with a HEAD request
        try {
          const response = await fetch(presignedUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          if (response.ok) {
            console.log(`   ✅ Presigned URL accessible - Status: ${response.status}`);
            console.log(`   📊 Content-Length: ${response.headers.get('content-length')}`);
            console.log(`   📝 Content-Type: ${response.headers.get('content-type')}`);
          } else {
            console.log(`   ❌ Presigned URL failed - Status: ${response.status} ${response.statusText}`);
          }
        } catch (httpError) {
          console.log(`   ❌ HTTP test failed: ${httpError}`);
        }
        
      } catch (presignError) {
        console.log(`   ❌ Failed to generate presigned URL: ${presignError}`);
      }
    }
    
    console.log('\n🎉 Presigned URL test completed!');
    
  } catch (error) {
    console.error('❌ Presigned URL test failed:', error);
  }
}

testPresignedUrls(); 