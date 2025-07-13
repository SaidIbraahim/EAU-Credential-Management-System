const { PrismaClient } = require('@prisma/client');

// Test both configurations
async function testConnectionPooling() {
  console.log('🔗 DATABASE CONNECTION POOLING TEST');
  console.log('===================================\n');

  try {
    // TEST 1: Default Prisma configuration
    console.log('📊 Testing DEFAULT Prisma configuration...');
    const defaultPrisma = new PrismaClient({
      log: ['query']
    });

    await defaultPrisma.$connect();
    
    const defaultStart = performance.now();
    
    // Run multiple concurrent queries to test connection handling
    const defaultQueries = await Promise.all([
      defaultPrisma.user.findFirst({ select: { id: true, email: true } }),
      defaultPrisma.student.count(),
      defaultPrisma.student.findFirst({ select: { id: true, fullName: true } }),
      defaultPrisma.user.count(),
      defaultPrisma.student.findFirst({ select: { registrationId: true } })
    ]);
    
    const defaultTime = performance.now() - defaultStart;
    console.log(`   🔗 Default config: ${Math.round(defaultTime)}ms for 5 concurrent queries\n`);
    
    await defaultPrisma.$disconnect();

    // TEST 2: Optimized connection pool configuration
    console.log('⚡ Testing OPTIMIZED connection pool configuration...');
    const optimizedPrisma = new PrismaClient({
      log: ['query'],
      datasources: {
        db: {
          url: `${process.env.DATABASE_URL}?connection_limit=20&pool_timeout=20&connect_timeout=60`
        }
      }
    });

    await optimizedPrisma.$connect();
    
    const optimizedStart = performance.now();
    
    // Same concurrent queries with optimized config
    const optimizedQueries = await Promise.all([
      optimizedPrisma.user.findFirst({ select: { id: true, email: true } }),
      optimizedPrisma.student.count(),
      optimizedPrisma.student.findFirst({ select: { id: true, fullName: true } }),
      optimizedPrisma.user.count(),
      optimizedPrisma.student.findFirst({ select: { registrationId: true } })
    ]);
    
    const optimizedTime = performance.now() - optimizedStart;
    console.log(`   ⚡ Optimized config: ${Math.round(optimizedTime)}ms for 5 concurrent queries\n`);
    
    await optimizedPrisma.$disconnect();

    // TEST 3: Connection latency test
    console.log('🌐 Testing connection latency...');
    const latencyPrisma = new PrismaClient();
    
    const latencyTests = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await latencyPrisma.$queryRaw`SELECT 1`;
      const latency = performance.now() - start;
      latencyTests.push(latency);
      console.log(`   Test ${i + 1}: ${Math.round(latency)}ms`);
    }
    
    const averageLatency = latencyTests.reduce((sum, time) => sum + time, 0) / latencyTests.length;
    console.log(`   📊 Average latency: ${Math.round(averageLatency)}ms\n`);
    
    await latencyPrisma.$disconnect();

    // TEST 4: Single query performance comparison
    console.log('🎯 Testing single query performance...');
    const singlePrisma = new PrismaClient();
    await singlePrisma.$connect();
    
    // Student list query (our problematic one)
    const studentStart = performance.now();
    const students = await singlePrisma.student.findMany({
      take: 10,
      select: {
        id: true,
        registrationId: true,
        fullName: true,
        status: true
      }
    });
    const studentTime = performance.now() - studentStart;
    
    // User query
    const userStart = performance.now();
    const user = await singlePrisma.user.findFirst({
      select: { id: true, email: true, role: true }
    });
    const userTime = performance.now() - userStart;
    
    console.log(`   👥 Student query (10 records): ${Math.round(studentTime)}ms`);
    console.log(`   🔐 User query: ${Math.round(userTime)}ms\n`);
    
    await singlePrisma.$disconnect();

    // RESULTS ANALYSIS
    console.log('📊 CONNECTION POOLING RESULTS');
    console.log('=============================');
    console.log(`🔗 Default concurrent queries: ${Math.round(defaultTime)}ms`);
    console.log(`⚡ Optimized concurrent queries: ${Math.round(optimizedTime)}ms`);
    console.log(`🌐 Average connection latency: ${Math.round(averageLatency)}ms`);
    console.log(`👥 Student query performance: ${Math.round(studentTime)}ms`);
    console.log(`🔐 User query performance: ${Math.round(userTime)}ms\n`);

    const improvement = Math.round(((defaultTime - optimizedTime) / defaultTime) * 100);
    
    console.log('📈 ANALYSIS:');
    if (improvement > 0) {
      console.log(`✅ Connection pooling improvement: ${improvement}%`);
    } else {
      console.log(`⚠️  No significant improvement from connection pooling`);
    }
    
    console.log('\n🔍 DIAGNOSIS:');
    if (averageLatency > 200) {
      console.log('❌ HIGH LATENCY: Connection to database is slow');
      console.log('💡 Possible causes: Network latency, database server load, geographic distance');
    } else if (averageLatency > 100) {
      console.log('⚠️  MODERATE LATENCY: Database connection could be faster');
    } else {
      console.log('✅ GOOD LATENCY: Database connection is responsive');
    }
    
    if (studentTime > 500) {
      console.log('❌ SLOW QUERIES: Individual queries are taking too long');
      console.log('💡 Possible causes: Missing indexes, large dataset, complex queries, hardware limitations');
    } else {
      console.log('✅ QUERY PERFORMANCE: Individual queries are reasonable');
    }

    console.log('\n💡 RECOMMENDATIONS:');
    if (averageLatency > 200) {
      console.log('🌐 Consider database server optimization or closer geographic location');
    }
    if (studentTime > 500) {
      console.log('🗂️ Review database indexes and query optimization');
      console.log('🔧 Consider database server hardware upgrade');
    }
    console.log('💾 Implement application-level caching for frequently accessed data');
    console.log('📄 Use pagination to limit data transfer');

  } catch (error) {
    console.error('❌ Connection pooling test failed:', error);
  }
  
  console.log('\n🎉 Connection pooling test completed!');
}

testConnectionPooling(); 