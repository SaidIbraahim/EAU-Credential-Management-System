const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔍 Testing database connection and performance...');

async function testDatabasePerformance() {
  try {
    // Test basic connection
    console.time('🔗 Connection Test');
    await prisma.$connect();
    console.timeEnd('🔗 Connection Test');
    
    // Test simple query
    console.time('📊 Simple Count Query');
    const count = await prisma.student.count();
    console.timeEnd('📊 Simple Count Query');
    console.log(`📊 Found ${count} students`);
    
    // Test complex query (what dashboard uses)
    console.time('🚀 Complex Dashboard Query');
    const [totalStudents, departments, academicYears] = await Promise.all([
      prisma.student.count(),
      prisma.department.findMany({
        include: {
          faculty: true,
          _count: {
            select: { students: true }
          }
        }
      }),
      prisma.academicYear.findMany()
    ]);
    console.timeEnd('🚀 Complex Dashboard Query');
    
    console.log(`📈 Dashboard data: ${totalStudents} students, ${departments.length} departments, ${academicYears.length} years`);
    
    // Test raw SQL performance
    console.time('⚡ Raw SQL Test');
    const rawResult = await prisma.$queryRaw`SELECT COUNT(*) FROM students`;
    console.timeEnd('⚡ Raw SQL Test');
    
    console.log('✅ Database connection tests completed');
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabasePerformance(); 