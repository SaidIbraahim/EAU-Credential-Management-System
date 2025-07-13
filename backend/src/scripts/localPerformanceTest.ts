import { prisma } from '../lib/prisma';
import PerformanceTestFramework from '../utils/performanceTestFramework';

/**
 * LOCAL PERFORMANCE TESTING SUITE
 * Tests our optimizations directly against the database
 */
async function runLocalPerformanceTest() {
  console.log('🧪 LOCAL PERFORMANCE TESTING - EAU CREDENTIAL SYSTEM');
  console.log('====================================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    const framework = new PerformanceTestFramework();

    // Load previous baseline for comparison
    let previousBaseline = null;
    try {
      const fs = await import('fs');
      const baselineFile = fs.readFileSync('performance-baseline.json', 'utf8');
      previousBaseline = JSON.parse(baselineFile);
      console.log('📋 Previous baseline loaded for comparison\n');
    } catch (error) {
      console.log('⚠️  No previous baseline found, creating new one\n');
    }

    // Run current performance tests
    console.log('🔄 TESTING CURRENT OPTIMIZATIONS...\n');
    const currentResults = await framework.runBaselineTests();

    // Compare with previous results
    if (previousBaseline) {
      console.log('📊 OPTIMIZATION IMPACT ANALYSIS');
      console.log('===============================\n');

      const previousResults = previousBaseline.results;
      
      currentResults.forEach(current => {
        const previous = previousResults.find((p: any) => p.testName === current.testName);
        if (previous) {
          const improvement = Math.round(((previous.duration - current.duration) / previous.duration) * 100);
          const trendIcon = improvement > 0 ? '📈' : improvement < 0 ? '📉' : '➡️';
          const improvementStr = improvement > 0 ? `+${improvement}%` : `${improvement}%`;
          
          console.log(`${trendIcon} ${current.testName}:`);
          console.log(`   Before: ${previous.duration}ms`);
          console.log(`   After:  ${current.duration}ms`);
          console.log(`   Change: ${improvementStr}\n`);
        }
      });
    }

    // Test specific optimizations we implemented
    console.log('🔧 TESTING SPECIFIC OPTIMIZATIONS...\n');

    // Test 1: User Login Optimization
    console.log('🔐 USER LOGIN OPTIMIZATION TEST:');
    console.log('Before: Full user query with heavy includes');
    const loginStart1 = performance.now();
    await prisma.user.findFirst({
      include: { auditLogs: true }
    });
    const loginDuration1 = performance.now() - loginStart1;

    console.log('After: Selective fields for authentication');
    const loginStart2 = performance.now();
    await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        lastLogin: true
      }
    });
    const loginDuration2 = performance.now() - loginStart2;

    const loginImprovement = Math.round(((loginDuration1 - loginDuration2) / loginDuration1) * 100);
    console.log(`   📊 Heavy query: ${Math.round(loginDuration1)}ms`);
    console.log(`   ⚡ Optimized query: ${Math.round(loginDuration2)}ms`);
    console.log(`   📈 Improvement: ${loginImprovement}%\n`);

    // Test 2: Student List Optimization
    console.log('🎓 STUDENT LIST OPTIMIZATION TEST:');
    console.log('Before: Full includes with all related data');
    const studentStart1 = performance.now();
    await prisma.student.findMany({
      take: 10,
      include: {
        department: true,
        faculty: true,
        academicYear: true,
        documents: true
      }
    });
    const studentDuration1 = performance.now() - studentStart1;

    console.log('After: Selective fields only');
    const studentStart2 = performance.now();
    await prisma.student.findMany({
      take: 10,
      select: {
        id: true,
        registrationId: true,
        fullName: true,
        status: true,
        department: { select: { name: true } },
        faculty: { select: { name: true } },
        academicYear: { select: { academicYear: true } },
        _count: { select: { documents: true } }
      }
    });
    const studentDuration2 = performance.now() - studentStart2;

    const studentImprovement = Math.round(((studentDuration1 - studentDuration2) / studentDuration1) * 100);
    console.log(`   📊 Heavy query: ${Math.round(studentDuration1)}ms`);
    console.log(`   ⚡ Optimized query: ${Math.round(studentDuration2)}ms`);
    console.log(`   📈 Improvement: ${studentImprovement}%\n`);

    // Test 3: Index Effectiveness
    console.log('🗂️  DATABASE INDEX EFFECTIVENESS TEST:');
    
    console.log('Testing email lookup (should use new index)...');
    const emailStart = performance.now();
    await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      select: { id: true, email: true, role: true }
    });
    const emailDuration = performance.now() - emailStart;
    console.log(`   ⚡ Email lookup: ${Math.round(emailDuration)}ms`);

    console.log('Testing registration ID lookup (should use new index)...');
    const regStart = performance.now();
    await prisma.student.findFirst({
      where: { registrationId: { contains: 'GRW' } },
      select: { id: true, registrationId: true, fullName: true }
    });
    const regDuration = performance.now() - regStart;
    console.log(`   ⚡ Registration ID lookup: ${Math.round(regDuration)}ms\n`);

    // Summary
    console.log('🎯 LOCAL TESTING SUMMARY');
    console.log('========================');
    console.log(`🔐 Login Query Improvement: ${loginImprovement}%`);
    console.log(`🎓 Student List Improvement: ${studentImprovement}%`);
    console.log(`⚡ Email Lookup Speed: ${Math.round(emailDuration)}ms`);
    console.log(`🔍 Registration Lookup Speed: ${Math.round(regDuration)}ms`);

    const avgImprovement = Math.round((loginImprovement + studentImprovement) / 2);
    console.log(`📈 Average Query Improvement: ${avgImprovement}%\n`);

    // Recommendations
    console.log('💡 NEXT STEPS BASED ON LOCAL TESTING:');
    if (avgImprovement >= 30) {
      console.log('✅ Excellent improvements! Ready for production deployment');
      console.log('🚀 Proceed to Phase 4: Frontend Caching Enhancement');
    } else if (avgImprovement >= 15) {
      console.log('👍 Good improvements, but critical issues remain');
      console.log('🔧 Proceed to tackle remaining critical issues:');
      console.log('   1. User Login optimization (application-level caching)');
      console.log('   2. Student List optimization (pagination/virtualization)');
    } else {
      console.log('⚠️  Limited improvements detected');
      console.log('🔍 Deep investigation needed for remaining bottlenecks');
    }

    console.log('\n✅ Local performance testing completed!');

  } catch (error) {
    console.error('❌ Local performance testing failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runLocalPerformanceTest()
    .then(() => {
      console.log('\n🎉 Local testing complete! You can now proceed with confidence.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Local testing failed:', error);
      process.exit(1);
    });
}

export default runLocalPerformanceTest; 