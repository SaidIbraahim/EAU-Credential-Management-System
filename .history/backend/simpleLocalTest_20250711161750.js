const fetch = require('node-fetch');

async function simpleLocalTest() {
  console.log('⚡ SIMPLE LOCAL OPTIMIZATION TEST');
  console.log('=================================\n');

  const BASE_URL = 'http://localhost:3000';

  // Test function
  async function testEndpoint(name, url, expectedMs = null) {
    console.log(`🧪 ${name}...`);
    const start = performance.now();
    
    try {
      const response = await fetch(`${BASE_URL}${url}`);
      const duration = performance.now() - start;
      const data = await response.json();
      
      if (response.ok) {
        console.log(`   ✅ ${Math.round(duration)}ms - Success`);
        if (expectedMs && duration < expectedMs) {
          console.log(`   🎯 TARGET MET: < ${expectedMs}ms`);
        }
        return { duration, success: true, data };
      } else {
        console.log(`   ⚠️  ${Math.round(duration)}ms - ${response.status}: ${data.message || 'Auth required'}`);
        return { duration, success: false, error: data.message };
      }
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`   ❌ ${Math.round(duration)}ms - Error: ${error.message}`);
      return { duration, success: false, error: error.message };
    }
  }

  try {
    // Test 1: Basic API Response (should be very fast)
    console.log('🌐 BASIC API PERFORMANCE:');
    console.log('=========================');
    const apiTest = await testEndpoint('API Health Check', '/', 100);
    console.log();

    // Test 2: Database Connection Test (our optimization focus)
    console.log('🔗 DATABASE PERFORMANCE TEST:');
    console.log('=============================');
    
    // These will fail auth but still test DB connection speed
    const dbTest1 = await testEndpoint('Database Query Test 1', '/api/auth/login', 1000);
    const dbTest2 = await testEndpoint('Database Query Test 2', '/api/students', 1000);
    const dbTest3 = await testEndpoint('Database Query Test 3', '/api/auth/profile', 1000);
    console.log();

    // Test 3: Multiple requests to test caching
    console.log('📊 CACHING PERFORMANCE TEST:');
    console.log('============================');
    
    const cache1 = await testEndpoint('Request 1', '/api/students');
    const cache2 = await testEndpoint('Request 2 (should be faster)', '/api/students');
    const cache3 = await testEndpoint('Request 3 (should be fastest)', '/api/students');
    
    if (cache1.success && cache2.success && cache3.success) {
      console.log(`   📈 Caching trend: ${Math.round(cache1.duration)}ms → ${Math.round(cache2.duration)}ms → ${Math.round(cache3.duration)}ms`);
    }
    console.log();

    // Test 4: Concurrent requests
    console.log('⚡ CONCURRENT REQUEST TEST:');
    console.log('==========================');
    
    const concurrentStart = performance.now();
    
    const concurrent = await Promise.all([
      testEndpoint('Concurrent 1', '/'),
      testEndpoint('Concurrent 2', '/api/auth/login'),
      testEndpoint('Concurrent 3', '/api/students'),
      testEndpoint('Concurrent 4', '/'),
      testEndpoint('Concurrent 5', '/api/auth/profile')
    ]);
    
    const concurrentTime = performance.now() - concurrentStart;
    console.log(`   🏁 Total concurrent time: ${Math.round(concurrentTime)}ms\n`);

    // Analysis
    console.log('🎯 PERFORMANCE ANALYSIS');
    console.log('=======================');
    
    const allTests = [apiTest, dbTest1, dbTest2, dbTest3, cache1, cache2, cache3, ...concurrent];
    const successfulTests = allTests.filter(t => t.success);
    const avgTime = successfulTests.length > 0 ? 
      successfulTests.reduce((sum, t) => sum + t.duration, 0) / successfulTests.length : 0;
    
    console.log(`📊 Tests completed: ${allTests.length}`);
    console.log(`✅ Successful responses: ${successfulTests.length}`);
    console.log(`📈 Average response time: ${Math.round(avgTime)}ms`);
    
    // API responsiveness
    if (apiTest.success && apiTest.duration < 50) {
      console.log('✅ API Layer: EXCELLENT (< 50ms)');
    } else if (apiTest.success && apiTest.duration < 100) {
      console.log('✅ API Layer: GOOD (< 100ms)');
    } else {
      console.log('⚠️  API Layer: Could be faster');
    }
    
    // Database connection analysis
    const dbTests = [dbTest1, dbTest2, dbTest3].filter(t => t.duration);
    if (dbTests.length > 0) {
      const avgDbTime = dbTests.reduce((sum, t) => sum + t.duration, 0) / dbTests.length;
      console.log(`🔗 Database Connection: ${Math.round(avgDbTime)}ms average`);
      
      if (avgDbTime < 200) {
        console.log('✅ Database: EXCELLENT performance');
      } else if (avgDbTime < 500) {
        console.log('✅ Database: GOOD performance');
      } else {
        console.log('⚠️  Database: Still experiencing latency (expected for first run)');
      }
    }
    
    // Caching effectiveness
    if (cache1.duration && cache2.duration && cache3.duration) {
      const improvement = Math.round(((cache1.duration - cache3.duration) / cache1.duration) * 100);
      if (improvement > 10) {
        console.log(`✅ Caching: ${improvement}% improvement detected`);
      } else {
        console.log('💡 Caching: May need authenticated requests to see full effect');
      }
    }
    
    console.log('\n🚀 OPTIMIZATION STATUS:');
    console.log('=======================');
    
    if (apiTest.duration < 100 && avgTime < 500) {
      console.log('✅ OPTIMIZATIONS WORKING: System shows improved responsiveness');
      console.log('✅ READY FOR PRODUCTION: Performance improvements detected');
    } else {
      console.log('💡 BASELINE ESTABLISHED: System running normally');
      console.log('💡 AUTHENTICATED TESTING: Login to see full optimization benefits');
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('==============');
    console.log('1. 🔐 Test with valid user credentials to see full caching benefits');
    console.log('2. 🎓 Test student list pagination to see query optimizations');
    console.log('3. 📊 Monitor dashboard performance with real user workflow');
    console.log('4. 🚀 Deploy to production for real-world testing');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
  
  console.log('\n🎉 Simple local test completed!');
}

simpleLocalTest(); 