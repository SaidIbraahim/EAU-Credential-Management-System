import PerformanceTestFramework from '../utils/performanceTestFramework';
import { prisma } from '../lib/prisma';

async function runBaseline() {
  console.log('🎯 EAU CREDENTIAL SYSTEM - PERFORMANCE BASELINE ANALYSIS');
  console.log('========================================================\n');
  
  const framework = new PerformanceTestFramework();
  
  try {
    // Test database connection first
    console.log('🔗 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // Run baseline tests
    const results = await framework.runBaselineTests();
    
    // Get system performance stats
    console.log('📊 Getting system performance statistics...');
    const systemStats = framework.getSystemStats();
    
    console.log('\n🔍 SYSTEM PERFORMANCE OVERVIEW:');
    console.log(`- Total requests tracked: ${systemStats.summary.totalRequests}`);
    console.log(`- Average response time (1h): ${systemStats.summary.avgDuration1Hour}ms`);
    console.log(`- Slow queries (1h): ${systemStats.summary.slowQueries1Hour}`);
    console.log(`- Slow query threshold: ${systemStats.summary.slowQueryThreshold}ms`);
    
    if (systemStats.slowestEndpoints.length > 0) {
      console.log('\n🐌 SLOWEST ENDPOINTS:');
      systemStats.slowestEndpoints.slice(0, 5).forEach(endpoint => {
        console.log(`  - ${endpoint.endpoint}: ${Math.round(endpoint.avgDuration)}ms avg`);
      });
    }
    
    // Analyze results and provide recommendations
    console.log('\n🎯 OPTIMIZATION PRIORITIES:');
    
    const criticalIssues = results.filter(r => r.status === 'critical');
    const slowIssues = results.filter(r => r.status === 'slow');
    
    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES (Immediate Action Required):');
      criticalIssues.forEach(issue => {
        console.log(`  🔴 ${issue.testName} (${issue.category}): ${issue.duration}ms`);
      });
    }
    
    if (slowIssues.length > 0) {
      console.log('\n⚠️  SLOW ISSUES (Should be optimized):');
      slowIssues.forEach(issue => {
        console.log(`  🟠 ${issue.testName} (${issue.category}): ${issue.duration}ms`);
      });
    }
    
    // Provide specific recommendations
    console.log('\n💡 RECOMMENDED OPTIMIZATION ORDER:');
    console.log('1. 🗂️  Database Indexes (Safest, High Impact)');
    console.log('2. 🔍 Query Optimization (Medium Risk, High Impact)');
    console.log('3. 📱 Frontend Caching (Low Risk, Medium Impact)');
    console.log('4. 🔐 Auth Optimization (Medium Risk, Medium Impact)');
    console.log('5. 📊 Advanced Features (Higher Risk, Variable Impact)');
    
    console.log('\n✅ Baseline analysis complete! Ready for optimizations.');
    
    // Save baseline to file for future comparison
    console.log('\n💾 Saving baseline results for future comparison...');
    const fs = await import('fs');
    const baselineData = {
      timestamp: new Date().toISOString(),
      results,
      systemStats
    };
    
    fs.writeFileSync(
      'performance-baseline.json', 
      JSON.stringify(baselineData, null, 2)
    );
    console.log('✅ Baseline saved to performance-baseline.json');
    
  } catch (error) {
    console.error('❌ Baseline analysis failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runBaseline().catch(console.error);
}

export default runBaseline; 