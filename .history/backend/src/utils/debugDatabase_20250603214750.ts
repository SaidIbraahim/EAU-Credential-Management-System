import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function debugDocuments() {
  console.log('🔍 Debugging Document Database Issues...\n');
  
  try {
    // 1. Check recent students
    console.log('1. Recent Students:');
    const recentStudents = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        registrationId: true,
        fullName: true,
        createdAt: true
      }
    });
    
    recentStudents.forEach(student => {
      console.log(`   - ${student.fullName} (ID: ${student.id}, RegID: ${student.registrationId}) - Created: ${student.createdAt}`);
    });
    
    // 2. Check all documents
    console.log('\n2. All Documents in Database:');
    const allDocuments = await prisma.document.findMany({
      orderBy: { uploadDate: 'desc' },
      include: {
        student: {
          select: {
            registrationId: true,
            fullName: true
          }
        }
      }
    });
    
    console.log(`   Found ${allDocuments.length} documents total`);
    allDocuments.forEach(doc => {
      console.log(`   - ${doc.documentType}: ${doc.fileName}`);
      console.log(`     Student ID: ${doc.registrationId}, Student: ${doc.student?.fullName || 'NOT FOUND'}`);
      console.log(`     Upload Date: ${doc.uploadDate}`);
      console.log(`     URL: ${doc.fileUrl}\n`);
    });
    
    // 3. Check for orphaned documents
    console.log('3. Checking for association issues:');
    const documentsWithoutStudents = await prisma.document.findMany({
      where: {
        student: {
          is: null
        }
      }
    });
    
    if (documentsWithoutStudents.length > 0) {
      console.log(`   ❌ Found ${documentsWithoutStudents.length} orphaned documents!`);
      documentsWithoutStudents.forEach(doc => {
        console.log(`      - ${doc.fileName} (registrationId: ${doc.registrationId})`);
      });
    } else {
      console.log(`   ✅ No orphaned documents found`);
    }
    
    // 4. Test specific student document lookup
    if (recentStudents.length > 0) {
      const testStudent = recentStudents[0];
      console.log(`\n4. Testing document lookup for ${testStudent.fullName}:`);
      
      // Method 1: By student ID (how documents are stored)
      const docsByStudentId = await prisma.document.findMany({
        where: { registrationId: testStudent.id }
      });
      console.log(`   Method 1 (by student ID ${testStudent.id}): ${docsByStudentId.length} documents`);
      
      // Method 2: By registration ID string (how frontend queries)
      const docsByRegId = await prisma.document.findMany({
        where: {
          student: {
            registrationId: testStudent.registrationId
          }
        }
      });
      console.log(`   Method 2 (by registration string ${testStudent.registrationId}): ${docsByRegId.length} documents`);
    }
    
  } catch (error) {
    console.error('❌ Database debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run debug if called directly
if (require.main === module) {
  debugDocuments();
} 