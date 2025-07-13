const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testDocumentUpload() {
  try {
    console.log('🧪 Testing document upload API...');
    
    // Test authentication first
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@eau.edu.so',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Authentication successful');
    
    // Create a simple test file
    const testContent = 'This is a test document content for upload testing';
    fs.writeFileSync('test-document.txt', testContent);
    
    // Test document upload
    const formData = new FormData();
    formData.append('files', fs.createReadStream('test-document.txt'));
    
    console.log('📤 Testing document upload for student GRW-BCS-2022 with CERTIFICATE type...');
    
    const uploadResponse = await axios.post(
      'http://localhost:3000/api/documents/student/GRW-BCS-2022/CERTIFICATE',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Upload successful:', uploadResponse.data);
    
    // Clean up
    fs.unlinkSync('test-document.txt');
    
  } catch (error) {
    console.error('❌ Upload failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Clean up
    if (fs.existsSync('test-document.txt')) {
      fs.unlinkSync('test-document.txt');
    }
  }
}

testDocumentUpload(); 