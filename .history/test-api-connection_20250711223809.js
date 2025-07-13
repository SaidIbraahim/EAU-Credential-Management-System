// Test API Connection - Diagnostic Script
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAPIConnection() {
  console.log('🔍 Testing API Connection...\n');

  try {
    // Test 1: Public endpoint (should work)
    console.log('1. Testing public academic endpoint...');
    const faculties = await axios.get(`${API_BASE}/academic/faculties`);
    console.log(`✅ Faculties: ${faculties.data.data.length} found`);

    // Test 2: Login
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'info@saidibrahim.tech',
      password: 'SuperAdmin123'
    });
    const token = loginResponse.data.data.token;
    console.log(`✅ Login successful, token: ${token.substring(0, 20)}...`);

    // Test 3: Authenticated endpoint (students)
    console.log('\n3. Testing authenticated students endpoint...');
    const studentsResponse = await axios.get(`${API_BASE}/students`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Students data received:`);
    console.log(`   - Total students: ${studentsResponse.data.total || 'N/A'}`);
    console.log(`   - Current page data: ${studentsResponse.data.data?.length || 0} students`);
    console.log(`   - Response structure: ${Object.keys(studentsResponse.data).join(', ')}`);

    // Test 4: Sample student details
    if (studentsResponse.data.data && studentsResponse.data.data.length > 0) {
      const firstStudent = studentsResponse.data.data[0];
      console.log('\n4. Testing student details...');
      const studentDetail = await axios.get(`${API_BASE}/students/${firstStudent.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Student details received for ${firstStudent.fullName}:`);
      console.log(`   - Has documents: ${studentDetail.data.data.documents?.length || 0} documents`);
      console.log(`   - Student structure: ${Object.keys(studentDetail.data.data).join(', ')}`);
      
      // Test 5: Documents endpoint
      if (firstStudent.registrationId) {
        console.log('\n5. Testing documents endpoint...');
        const documentsResponse = await axios.get(`${API_BASE}/documents/student/${firstStudent.registrationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Documents: ${documentsResponse.data.length} found`);
        if (documentsResponse.data.length > 0) {
          const doc = documentsResponse.data[0];
          console.log(`   - Sample document has fileUrl: ${!!doc.fileUrl}`);
          console.log(`   - Sample document has presignedUrl: ${!!doc.presignedUrl}`);
        }
      }
    }

    console.log('\n🎉 All API tests passed! Backend is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Check if frontend is properly authenticated');
    console.log('2. Verify frontend is using correct API endpoints');
    console.log('3. Check browser network tab for failed requests');
    console.log('4. Clear browser localStorage and re-login');

  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
}

testAPIConnection(); 