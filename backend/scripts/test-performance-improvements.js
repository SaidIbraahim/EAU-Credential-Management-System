const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPerformanceImprovements() {
  console.log('🚀 Testing Performance Improvements After Optimization');
  console.log('=' .repeat(60));

  const tests = [
    {
      name: 'Student List Query (Paginated)',
      operation: async () => {
        return await prisma.student.findMany({
          take: 20,
          include: {
            department: { select: { name: true } },
            faculty: { select: { name: true } },
            academicYear: { select: { academicYear: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
      },
      target: 200, // Should be under 200ms
      description: 'Paginated student list with relations'
    },
    {
      name: 'Student by Registration ID (Unique)',
      operation: async () => {
        // Find a student first to get a valid ID
        const students = await prisma.student.findMany({ take: 1 });
        if (students.length === 0) return null;
        
        return await prisma.student.findUnique({
          where: { registrationId: students[0].registrationId },
          include: {
            department: true,
            faculty: true,
            academicYear: true
          }
        });
      },
      target: 50, // Should be under 50ms with unique index
      description: 'Single student lookup by indexed registration ID'
    },
    {
      name: 'Student by Certificate ID (Unique)',
      operation: async () => {
        // Find a student with certificate ID
        const student = await prisma.student.findFirst({
          where: { certificateId: { not: null } }
        });
        if (!student?.certificateId) return null;
        
        return await prisma.student.findUnique({
          where: { certificateId: student.certificateId }
        });
      },
      target: 50, // Should be under 50ms with unique index
      description: 'Single student lookup by indexed certificate ID'
    },
    {
      name: 'Students by Department (Filtered)',
      operation: async () => {
        return await prisma.student.findMany({
          where: { departmentId: 1 },
          take: 10,
          select: {
            id: true,
            registrationId: true,
            fullName: true,
            status: true
          }
        });
      },
      target: 100, // Should be under 100ms with department index
      description: 'Filtered students by department with index'
    },
    {
      name: 'User Lookup (Auth)',
      operation: async () => {
        const users = await prisma.user.findMany({ take: 1 });
        if (users.length === 0) return null;
        
        return await prisma.user.findUnique({
          where: { id: users[0].id },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true
          }
        });
      },
      target: 30, // Should be very fast with user index
      description: 'User authentication lookup'
    },
    {
      name: 'Department List with Counts',
      operation: async () => {
        return await prisma.$queryRaw`
          SELECT 
            d.id,
            d.name,
            COUNT(s.id)::int as student_count
          FROM departments d
          LEFT JOIN students s ON d.id = s.department_id
          GROUP BY d.id, d.name
          ORDER BY d.name ASC
        `;
      },
      target: 150, // Should be fast with optimized query
      description: 'Department list with student counts'
    },
    {
      name: 'Academic Years with Counts',
      operation: async () => {
        return await prisma.$queryRaw`
          SELECT 
            ay.id,
            ay.academic_year,
            COUNT(s.id)::int as student_count
          FROM academic_years ay
          LEFT JOIN students s ON ay.id = s.academic_year_id
          GROUP BY ay.id, ay.academic_year
          ORDER BY ay.academic_year DESC
        `;
      },
      target: 100, // Should be fast with indexes
      description: 'Academic years with student counts'
    },
    {
      name: 'Audit Log Query (Recent)',
      operation: async () => {
        return await prisma.auditLog.findMany({
          take: 20,
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: { username: true, email: true }
            }
          }
        });
      },
      target: 150, // Should be fast with timestamp index
      description: 'Recent audit logs with user info'
    },
    {
      name: 'Document Lookup by Student',
      operation: async () => {
        const students = await prisma.student.findMany({ take: 1 });
        if (students.length === 0) return [];
        
        return await prisma.document.findMany({
          where: { registrationId: students[0].id },
          select: {
            id: true,
            documentType: true,
            fileName: true,
            uploadDate: true
          }
        });
      },
      target: 80, // Should be fast with registration_id index
      description: 'Documents by student with index'
    }
  ];

  console.log(`Running ${tests.length} performance tests...\n`);

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      
      // Warm up query (run once to exclude cold start effects)
      await test.operation();
      
      // Actual performance test
      const startTime = Date.now();
      const result = await test.operation();
      const duration = Date.now() - startTime;
      
      const status = duration <= test.target ? '✅ PASS' : '❌ FAIL';
      const performance = duration <= test.target ? 'EXCELLENT' : 
                         duration <= test.target * 2 ? 'ACCEPTABLE' : 'POOR';
      
      console.log(`   ${status} ${duration}ms (target: ${test.target}ms) - ${performance}`);
      console.log(`   📝 ${test.description}`);
      
      if (result !== null && result !== undefined) {
        const recordCount = Array.isArray(result) ? result.length : 1;
        console.log(`   📊 Retrieved ${recordCount} record(s)`);
      }
      
      console.log('');

      results.push({
        name: test.name,
        duration,
        target: test.target,
        passed: duration <= test.target,
        performance,
        description: test.description
      });

      if (duration <= test.target) {
        passed++;
      } else {
        failed++;
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      console.log('');
      failed++;
      
      results.push({
        name: test.name,
        duration: null,
        target: test.target,
        passed: false,
        performance: 'ERROR',
        error: error.message,
        description: test.description
      });
    }
  }

  // Summary Report
  console.log('=' .repeat(60));
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('');

  // Performance Analysis
  const avgDuration = results
    .filter(r => r.duration !== null)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration !== null).length;

  console.log(`📈 Average Query Time: ${avgDuration.toFixed(1)}ms`);
  
  const excellentQueries = results.filter(r => r.performance === 'EXCELLENT').length;
  const acceptableQueries = results.filter(r => r.performance === 'ACCEPTABLE').length;
  const poorQueries = results.filter(r => r.performance === 'POOR').length;

  console.log(`🚀 Excellent Performance: ${excellentQueries} queries`);
  console.log(`👍 Acceptable Performance: ${acceptableQueries} queries`);
  console.log(`🐌 Poor Performance: ${poorQueries} queries`);
  console.log('');

  // Recommendations
  if (failed > 0) {
    console.log('🔧 RECOMMENDATIONS:');
    results.filter(r => !r.passed).forEach(result => {
      console.log(`   • ${result.name}: ${result.error || 'Consider further optimization'}`);
    });
  } else {
    console.log('🎉 All performance tests passed! Database is well optimized.');
  }

  console.log('');
  console.log('🏁 Performance testing completed!');
  
  return {
    totalTests: tests.length,
    passed,
    failed,
    successRate: (passed / tests.length) * 100,
    averageDuration: avgDuration,
    results
  };
}

// Run the tests
testPerformanceImprovements()
  .then(summary => {
    console.log('\n✅ Performance test completed successfully');
    process.exit(summary.failed === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  }); 