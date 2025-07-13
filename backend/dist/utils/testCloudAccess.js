"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const storage_1 = require("../config/storage");
async function testCloudAccess() {
    console.log('🔍 Testing Cloud Storage Access...\n');
    try {
        const testFiles = [
            'documents/cced46ec-3a46-45f4-9763-2d56281186f2.pdf',
            'documents/bb0560d8-8966-4332-a2f8-cd6a25b3776f.pdf',
            'documents/126a118b-2947-494e-b10c-6447581e00a9.png'
        ];
        console.log('📁 Testing file access for uploaded documents:');
        for (const key of testFiles) {
            console.log(`\n   Testing: ${key}`);
            try {
                const headCommand = new client_s3_1.HeadObjectCommand({
                    Bucket: storage_1.STORAGE_BUCKET_NAME,
                    Key: key
                });
                const headResponse = await storage_1.storageClient.send(headCommand);
                console.log(`   ✅ File exists - Size: ${headResponse.ContentLength} bytes`);
                console.log(`   📝 Content-Type: ${headResponse.ContentType}`);
                console.log(`   🕒 Last Modified: ${headResponse.LastModified}`);
                const publicUrl = (0, storage_1.generateFileUrl)(key);
                console.log(`   🌐 Public URL: ${publicUrl}`);
                try {
                    const getCommand = new client_s3_1.GetObjectCommand({
                        Bucket: storage_1.STORAGE_BUCKET_NAME,
                        Key: key
                    });
                    const getResponse = await storage_1.storageClient.send(getCommand);
                    console.log(`   ✅ Object accessible via SDK`);
                    if (getResponse.Body) {
                        const chunks = [];
                        for await (const chunk of getResponse.Body) {
                            chunks.push(chunk);
                        }
                        const buffer = Buffer.concat(chunks);
                        console.log(`   📊 Content size: ${buffer.length} bytes`);
                    }
                }
                catch (getError) {
                    console.log(`   ❌ SDK access failed: ${getError}`);
                }
                try {
                    console.log(`   🌐 Testing HTTP access...`);
                    const response = await fetch(publicUrl, {
                        method: 'HEAD',
                        signal: AbortSignal.timeout(5000)
                    });
                    if (response.ok) {
                        console.log(`   ✅ HTTP HEAD successful - Status: ${response.status}`);
                        console.log(`   📊 Content-Length: ${response.headers.get('content-length')}`);
                        console.log(`   📝 Content-Type: ${response.headers.get('content-type')}`);
                    }
                    else {
                        console.log(`   ❌ HTTP HEAD failed - Status: ${response.status} ${response.statusText}`);
                        try {
                            const errorText = await response.text();
                            console.log(`   📄 Error response: ${errorText}`);
                        }
                        catch (_a) {
                            console.log(`   📄 Could not read error response`);
                        }
                    }
                }
                catch (httpError) {
                    console.log(`   ❌ HTTP test failed: ${httpError}`);
                }
                try {
                    const altPublicUrl = `https://pub-${storage_1.STORAGE_BUCKET_NAME}.r2.dev/${key}`;
                    console.log(`   🔄 Testing alternative public URL: ${altPublicUrl}`);
                    const altResponse = await fetch(altPublicUrl, {
                        method: 'HEAD',
                        signal: AbortSignal.timeout(5000)
                    });
                    if (altResponse.ok) {
                        console.log(`   ✅ Alternative URL successful - Status: ${altResponse.status}`);
                        console.log(`   📊 Content-Length: ${altResponse.headers.get('content-length')}`);
                        console.log(`   📝 Content-Type: ${altResponse.headers.get('content-type')}`);
                    }
                    else {
                        console.log(`   ❌ Alternative URL failed - Status: ${altResponse.status} ${altResponse.statusText}`);
                    }
                }
                catch (altError) {
                    console.log(`   ❌ Alternative URL test failed: ${altError}`);
                }
            }
            catch (headError) {
                console.log(`   ❌ File not found or inaccessible: ${headError}`);
            }
        }
        console.log('\n🔧 Bucket Configuration:');
        console.log(`   Bucket: ${storage_1.STORAGE_BUCKET_NAME}`);
        console.log(`   Provider: ${process.env.CLOUD_STORAGE_PROVIDER}`);
        console.log(`   Endpoint: ${process.env.CLOUD_STORAGE_ENDPOINT}`);
        console.log(`   Public Domain: ${process.env.CLOUD_STORAGE_PUBLIC_DOMAIN || 'Not configured'}`);
        console.log(`   Force Path Style: ${process.env.CLOUD_STORAGE_FORCE_PATH_STYLE || 'false'}`);
    }
    catch (error) {
        console.error('❌ Cloud access test failed:', error);
    }
}
testCloudAccess();
//# sourceMappingURL=testCloudAccess.js.map