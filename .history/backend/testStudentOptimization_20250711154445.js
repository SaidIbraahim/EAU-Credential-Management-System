const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testStudentOptimization() {
  console.log('🎓 STUDENT LIST OPTIMIZATION TEST');
  console.log('=================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected\n');
    
    // TEST 1: Original heavy query (what we had before)
    console.log('📊 Testing ORIGINAL approach (heavy includes)...');
    const originalStart = performance.now();
    
    const originalStudents = await prisma.student.findMany({
      take: 25, // Standard page size
      include: {
        department: true,
        faculty: true,
        academicYear: true,
        documents: true  // This is the killer - loads ALL documents
      }
    });
    
    const originalTime = performance.now() - originalStart;
    console.log(`   🐌 Heavy query: ${Math.round(originalTime)}ms`);
    console.log(`   📦 Data loaded: ${originalStudents.length} students with ALL related data\n`);
    
    // TEST 2: Optimized selective query
    console.log('⚡ Testing OPTIMIZED approach (selective fields)...');
    const optimizedStart = performance.now();
    
    const optimizedStudents = await prisma.student.findMany({
      take: 25,
      select: {
        // Essential fields only
        id: true,
        registrationId: true,
        fullName: true,
        status: true,
        gender: true,
        
        // Minimal related data
        department: {
          select: { id: true, name: true }
        },
        faculty: {
          select: { id: true, name: true }
        },
        academicYear: {
          select: { id: true, academicYear: true }
        },
        
        // Count only, not full data
        _count: {
          select: { documents: true }
        },
        
        // Essential dates
        createdAt: true,
        graduationDate: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const optimizedTime = performance.now() - optimizedStart;
    console.log(`   ⚡ Optimized query: ${Math.round(optimizedTime)}ms`);
    console.log(`   📦 Data loaded: ${optimizedStudents.length} students with selective data\n`);
    
    // TEST 3: Pagination simulation (what users actually need)
    console.log('📄 Testing PAGINATION approach (10 students only)...');
    const paginationStart = performance.now();
    
    const [count, paginatedStudents] = await Promise.all([
      prisma.student.count(),
      prisma.student.findMany({
        take: 10, // Even smaller page
        select: {
          id: true,
          registrationId: true,
          fullName: true,
          status: true,
          department: { select: { name: true } },
          _count: { select: { documents: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    
    const paginationTime = performance.now() - paginationStart;
    console.log(`   🚀 Paginated query: ${Math.round(paginationTime)}ms`);
    console.log(`   📦 Data loaded: ${paginatedStudents.length} students + total count (${count})\n`);
    
    // TEST 4: Search simulation
    console.log('🔍 Testing SEARCH optimization...');
    const searchStart = performance.now();
    
    const searchResults = await prisma.student.findMany({
      where: {
        OR: [
          { registrationId: { contains: 'GRW', mode: 'insensitive' } },
          { fullName: { contains: 'test', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        registrationId: true,
        fullName: true,
        status: true
      },
      take: 10
    });
    
    const searchTime = performance.now() - searchStart;
    console.log(`   🔍 Search query: ${Math.round(searchTime)}ms`);
    console.log(`   📦 Results found: ${searchResults.length} matches\n`);
    
    // RESULTS ANALYSIS
    console.log('🎯 STUDENT LIST OPTIMIZATION RESULTS');
    console.log('====================================');
    console.log(`📊 Original (heavy): ${Math.round(originalTime)}ms`);
    console.log(`⚡ Optimized (selective): ${Math.round(optimizedTime)}ms`);
    console.log(`🚀 Paginated (smart): ${Math.round(paginationTime)}ms`);
    console.log(`🔍 Search (targeted): ${Math.round(searchTime)}ms\n`);
    
    const selectiveImprovement = Math.round(((originalTime - optimizedTime) / originalTime) * 100);
    const paginationImprovement = Math.round(((originalTime - paginationTime) / originalTime) * 100);
    
    console.log('📈 IMPROVEMENTS:');
    console.log(`   Selective loading: ${selectiveImprovement}%`);
    console.log(`   Smart pagination: ${paginationImprovement}%\n`);
    
    // TARGET ASSESSMENT
    console.log('🎯 TARGET ASSESSMENT (871ms → <200ms):');
    if (paginationTime < 200) {
      console.log('✅ TARGET ACHIEVED: Pagination approach < 200ms');
    } else if (paginationTime < 400) {
      console.log('👍 GOOD PROGRESS: Getting close to 200ms target');
    } else {
      console.log('⚠️  Still above target - need further optimization');
    }
    
    if (searchTime < 100) {
      console.log('✅ SEARCH EXCELLENT: < 100ms');
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('==================');
    console.log('🚀 Use pagination by default (10-25 items per page)');
    console.log('⚡ Use selective field loading always');
    console.log('💾 Add caching for frequently accessed pages');
    console.log('🔍 Use dedicated search endpoint for fast lookups');
    console.log('📊 Load counts separately from data when needed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🎉 Student optimization test completed!');
  }
}

testStudentOptimization(); 