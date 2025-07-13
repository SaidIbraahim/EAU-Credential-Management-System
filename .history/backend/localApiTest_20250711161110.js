const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@grw.com'; // Adjust if needed
const TEST_PASSWORD = 'admin123'; // Adjust if needed

class LocalAPITester {
  constructor() {
    this.token = null;
    this.results = [];
  }

  async testEndpoint(name, url, options = {}) {
    console.log(`🧪 Testing: ${name}...`);
    const start = performance.now();
    
    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
          ...options.headers
        },
        ...options
      });
      
      const duration = performance.now() - start;
      const data = await response.json();
      
      if (response.ok) {
        console.log(`   ✅ ${Math.round(duration)}ms - Success`);
        this.results.push({ name, duration, success: true });
        return { data, duration, success: true };
      } else {
        console.log(`   ❌ ${Math.round(duration)}ms - Error: ${data.message || 'Unknown error'}`);
        this.results.push({ name, duration, success: false, error: data.message });
        return { data, duration, success: false };
      }
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`   💥 ${Math.round(duration)}ms - Failed: ${error.message}`);
      this.results.push({ name, duration, success: false, error: error.message });
      return { duration, success: false, error: error.message };
    }
  }

  async runFullTest() {
    console.log('🚀 LOCAL API PERFORMANCE TEST');
    console.log('=============================\n');

    try {
      // Test 1: Login Performance (Critical optimization)
      console.log('🔐 TESTING LOGIN OPTIMIZATION:');
      console.log('==============================');
      
      const loginResult = await this.testEndpoint('Login (First Time)', '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        })
      });

      if (loginResult.success) {
        this.token = loginResult.data.data.token;
        console.log('   🎫 Token acquired for authenticated requests\n');
        
        // Test login again to see caching effect
        const cachedLoginResult = await this.testEndpoint('Login (Cached)', '/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
          })
        });
        
        console.log(`   📊 Cache improvement: ${Math.round(((loginResult.duration - cachedLoginResult.duration) / loginResult.duration) * 100)}%\n`);
      } else {
        console.log('   ⚠️  Login failed - check credentials\n');
      }

      // Test 2: Student List Performance (Critical optimization)
      console.log('🎓 TESTING STUDENT LIST OPTIMIZATION:');
      console.log('====================================');
      
      await this.testEndpoint('Student List (First Load)', '/api/students');
      await this.testEndpoint('Student List (Cached)', '/api/students');
      await this.testEndpoint('Student List (Page 2)', '/api/students?page=2');
      console.log();

      // Test 3: Dashboard Performance
      console.log('📊 TESTING DASHBOARD PERFORMANCE:');
      console.log('=================================');
      
      await this.testEndpoint('User Profile', '/api/auth/profile');
      
      // Try to test dashboard stats if endpoint exists
      await this.testEndpoint('Dashboard Stats', '/api/students/stats');
      console.log();

      // Test 4: Search Performance
      console.log('🔍 TESTING SEARCH OPTIMIZATION:');
      console.log('===============================');
      
      await this.testEndpoint('Student Search', '/api/students/search?q=test');
      await this.testEndpoint('Student Search (Cached)', '/api/students/search?q=test');
      console.log();

      // Test 5: Multiple Concurrent Requests
      console.log('⚡ TESTING CONCURRENT PERFORMANCE:');
      console.log('==================================');
      
      const concurrentStart = performance.now();
      
      const concurrentPromises = [
        this.testEndpoint('Concurrent 1', '/api/auth/profile'),
        this.testEndpoint('Concurrent 2', '/api/students?page=1&limit=10'),
        this.testEndpoint('Concurrent 3', '/api/students/stats'),
        this.testEndpoint('Concurrent 4', '/api/students/search?q=grw'),
        this.testEndpoint('Concurrent 5', '/api/auth/profile')
      ];
      
      await Promise.all(concurrentPromises);
      
      const concurrentTotal = performance.now() - concurrentStart;
      console.log(`   🏁 Total concurrent time: ${Math.round(concurrentTotal)}ms\n`);

      // Test 6: Cache Statistics (if available)
      console.log('📊 TESTING CACHE STATISTICS:');
      console.log('============================');
      
      await this.testEndpoint('User Cache Stats', '/api/auth/cache/stats');
      await this.testEndpoint('Student Cache Stats', '/api/students/cache/stats');
      console.log();

      // Results Summary
      this.showResults();

    } catch (error) {
      console.error('💥 Test suite failed:', error);
    }
  }

  showResults() {
    console.log('🎯 LOCAL TESTING RESULTS SUMMARY');
    console.log('================================');
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log(`✅ Successful tests: ${successful.length}`);
    console.log(`❌ Failed tests: ${failed.length}`);
    
    if (successful.length > 0) {
      const avgTime = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
      const fastTests = successful.filter(r => r.duration < 100);
      
      console.log(`📊 Average response time: ${Math.round(avgTime)}ms`);
      console.log(`⚡ Fast responses (<100ms): ${fastTests.length}/${successful.length}`);
      
      // Show performance by category
      const loginTests = successful.filter(r => r.name.includes('Login'));
      const studentTests = successful.filter(r => r.name.includes('Student'));
      
      if (loginTests.length > 0) {
        const avgLogin = loginTests.reduce((sum, r) => sum + r.duration, 0) / loginTests.length;
        console.log(`🔐 Login performance: ${Math.round(avgLogin)}ms average`);
      }
      
      if (studentTests.length > 0) {
        const avgStudent = studentTests.reduce((sum, r) => sum + r.duration, 0) / studentTests.length;
        console.log(`🎓 Student operations: ${Math.round(avgStudent)}ms average`);
      }
    }
    
    console.log('\n💡 PERFORMANCE ANALYSIS:');
    console.log('========================');
    
    // Analyze cache effectiveness
    const firstLoads = successful.filter(r => r.name.includes('First'));
    const cachedLoads = successful.filter(r => r.name.includes('Cached'));
    
    if (firstLoads.length > 0 && cachedLoads.length > 0) {
      const avgFirst = firstLoads.reduce((sum, r) => sum + r.duration, 0) / firstLoads.length;
      const avgCached = cachedLoads.reduce((sum, r) => sum + r.duration, 0) / cachedLoads.length;
      const improvement = Math.round(((avgFirst - avgCached) / avgFirst) * 100);
      
      console.log(`📈 Cache effectiveness: ${improvement}% improvement`);
      console.log(`   First loads: ${Math.round(avgFirst)}ms`);
      console.log(`   Cached loads: ${Math.round(avgCached)}ms`);
    }
    
    // Performance targets assessment
    console.log('\n🎯 TARGET ASSESSMENT:');
    console.log('=====================');
    
    const fastLogins = loginTests.filter(r => r.duration < 100);
    const fastStudents = studentTests.filter(r => r.duration < 200);
    
    console.log(`🔐 Login target (<100ms): ${fastLogins.length}/${loginTests.length} tests`);
    console.log(`🎓 Student target (<200ms): ${fastStudents.length}/${studentTests.length} tests`);
    
    if (fastLogins.length > 0 || fastStudents.length > 0) {
      console.log('✅ OPTIMIZATION SUCCESS: Targets being met!');
    } else {
      console.log('⚠️  Targets not yet met - may need cache warm-up');
    }
    
    console.log('\n🚀 READY FOR PRODUCTION?');
    console.log('========================');
    
    if (successful.length >= failed.length * 3 && fastTests.length > 0) {
      console.log('✅ YES: Strong performance improvements detected');
      console.log('💡 Deploy with confidence - users will notice the difference!');
    } else {
      console.log('⚠️  REVIEW: Some tests failed or performance needs tuning');
      console.log('💡 Consider debugging failed tests before production deployment');
    }
  }
}

// Run the test
async function runLocalTest() {
  const tester = new LocalAPITester();
  await tester.runFullTest();
  
  console.log('\n🎉 Local API testing completed!');
  console.log('💡 Use these results to verify optimizations before production deployment.');
}

runLocalTest().catch(console.error); 