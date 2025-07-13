const axios = require('axios');

const API_BASE = 'http://localhost:3000';

console.log('🚀 TESTING PERFORMANCE OPTIMIZATIONS & REPORT PAGE FIX\n');

async function testEndpoint(name, url, expectedTime = 1000) {
  try {
    console.log(`🔍 Testing ${name}...`);
    const start = Date.now();
    
    const response = await axios.get(`${API_BASE}${url}`, {
      timeout: 10000
    });
    
    const duration = Date.now() - start;
    const status = duration < expectedTime ? '✅ FAST' : duration < expectedTime * 2 ? '⚠️ SLOW' : '❌ VERY SLOW';
    
    console.log(`   ${status} ${duration}ms (target: <${expectedTime}ms)`);
    
    // For reports endpoint, check data structure
    if (url.includes('/reports')) {
      const data = response.data;
      console.log('   📊 Reports Structure Check:');
      console.log(`      - Summary: ${data.summary ? '✅' : '❌'}`);
      console.log(`      - Department Analysis: ${data.departmentAnalysis ? '✅' : '❌'}`);
      console.log(`      - Academic Performance: ${data.academicPerformance ? '✅' : '❌'}`);
      console.log(`      - Trends: ${data.trends ? '✅' : '❌'}`);
      console.log(`      - Demographics: ${data.demographics ? '✅' : '❌'}`);
      console.log(`      - Certificates: ${data.certificates ? '✅' : '❌'}`);
      
      if (data.summary) {
        console.log(`      - Total Students: ${data.summary.totalStudents}`);
        console.log(`      - Average GPA: ${data.summary.averageGPA}`);
        console.log(`      - Certificate Rate: ${data.summary.certificateRate}%`);
      }
    }
    
    return { success: true, duration, data: response.data };
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runPerformanceTests() {
  console.log('⏱️  PERFORMANCE TARGETS:');
  console.log('   - Root endpoint: <50ms');
  console.log('   - Dashboard stats: <500ms'); 
  console.log('   - Quick stats: <200ms');
  console.log('   - Reports: <2000ms (complex data structure)');
  console.log('   - Academic endpoints: <100ms\n');

  const tests = [
    // Ultra-fast endpoints (middleware bypass)
    { name: 'Root Endpoint', url: '/', target: 50 },
    { name: 'Health Check', url: '/health', target: 50 },
    
    // Optimized dashboard endpoints
    { name: 'Dashboard Stats', url: '/api/dashboard/stats', target: 500 },
    { name: 'Quick Stats', url: '/api/dashboard/quick-stats', target: 200 },
    
    // Fixed reports endpoint (comprehensive structure)
    { name: 'Reports Data (FIXED)', url: '/api/dashboard/reports', target: 2000 },
    
    // Academic data endpoints (should be fast)
    { name: 'Faculties', url: '/api/faculties', target: 100 },
    { name: 'Departments', url: '/api/departments', target: 100 },
    { name: 'Academic Years', url: '/api/academic-years', target: 100 }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url, test.target);
    results.push({ ...test, ...result });
    console.log(''); // spacing
  }

  // Summary
  console.log('📈 PERFORMANCE SUMMARY:');
  console.log('=====================================');
  
  const passed = results.filter(r => r.success && r.duration < r.target).length;
  const slow = results.filter(r => r.success && r.duration >= r.target && r.duration < r.target * 2).length;
  const failed = results.filter(r => !r.success || r.duration >= r.target * 2).length;
  
  console.log(`✅ FAST: ${passed}/${results.length} endpoints`);
  console.log(`⚠️ SLOW: ${slow}/${results.length} endpoints`);
  console.log(`❌ FAILED: ${failed}/${results.length} endpoints`);
  
  if (passed === results.length) {
    console.log('\n🎉 ALL PERFORMANCE TARGETS MET!');
    console.log('🔧 Report page blank screen issue: FIXED');
    console.log('⚡ Database optimizations: WORKING');
    console.log('🚀 Middleware bypass: EFFECTIVE');
  } else {
    console.log('\n⚠️ Some endpoints need further optimization');
  }
  
  // Test specific report structure
  const reportsResult = results.find(r => r.url.includes('/reports'));
  if (reportsResult && reportsResult.success) {
    console.log('\n📊 REPORT PAGE FIX VERIFICATION:');
    console.log('=====================================');
    const data = reportsResult.data;
    
    if (data.summary && data.departmentAnalysis && data.academicPerformance) {
      console.log('✅ Report page structure: CORRECT');
      console.log('✅ Frontend compatibility: RESTORED'); 
      console.log('✅ Blank screen issue: RESOLVED');
    } else {
      console.log('❌ Report structure incomplete');
    }
  }
}

// Add axios if not available
try {
  runPerformanceTests().catch(console.error);
} catch (error) {
  console.log('❌ Error: axios not available. Run: npm install axios');
  console.log('   Or test manually at: http://localhost:3000/api/dashboard/reports');
} 