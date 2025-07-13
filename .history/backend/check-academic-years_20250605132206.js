const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAcademicYears() {
  try {
    console.log('🔍 Checking Academic Years in Database:');
    console.log('=====================================');
    
    const academicYears = await prisma.academicYear.findMany({
      orderBy: { academicYear: 'asc' }
    });
    
    if (academicYears.length === 0) {
      console.log('❌ No academic years found in database!');
      return;
    }
    
    academicYears.forEach((year, index) => {
      console.log(`${index + 1}. ID: ${year.id}`);
      console.log(`   academicYear: "${year.academicYear}"`);
      console.log(`   Length: ${year.academicYear.length} characters`);
      console.log(`   Contains "2020-2021": ${year.academicYear.includes('2020-2021')}`);
      console.log(`   Exact match test: "${year.academicYear}" === "2020-2021" = ${year.academicYear === '2020-2021'}`);
      console.log(`   Trimmed match test: "${year.academicYear.trim()}" === "2020-2021" = ${year.academicYear.trim() === '2020-2021'}`);
      console.log('   ---');
    });
    
    // Test the exact search logic from our findEntityIdByName function
    console.log('\n🔍 Testing findEntityIdByName logic:');
    const searchName = '2020-2021';
    const found = academicYears.find(item => 
      item.academicYear.toLowerCase().trim() === searchName.toLowerCase().trim()
    );
    
    if (found) {
      console.log(`✅ Found match: ID ${found.id}, academicYear: "${found.academicYear}"`);
    } else {
      console.log(`❌ No match found for "${searchName}"`);
      console.log('Available academic years:');
      academicYears.forEach(year => {
        console.log(`   - "${year.academicYear}"`);
      });
    }
    
  } catch (error) {
    console.error('Error checking academic years:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAcademicYears(); 