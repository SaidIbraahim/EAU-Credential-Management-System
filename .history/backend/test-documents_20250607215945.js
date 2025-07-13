const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDocuments() {
  try {
    console.log('🔍 Testing document functionality...');
    
    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        registrationId: true,
        fullName: true,
        documents: true
      }
    });
    
    console.log(`📊 Found ${students.length} students`);
    
    for (const student of students) {
      console.log(`\n👤 Student: ${student.fullName} (${student.registrationId})`);
      console.log(`   Internal ID: ${student.id}`);
      console.log(`   Documents: ${student.documents.length}`);
      
      if (student.documents.length > 0) {
        student.documents.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.fileName} (${doc.documentType}) - ${doc.fileSize} bytes`);
        });
      } else {
        console.log('   No documents found');
      }
    }
    
    // Test fetching documents by registration ID for the first student
    if (students.length > 0) {
      const testStudent = students[0];
      console.log(`\n🧪 Testing document fetch for ${testStudent.registrationId}`);
      
      const documents = await prisma.document.findMany({
        where: {
          student: {
            registrationId: testStudent.registrationId
          }
        },
        include: {
          student: true
        }
      });
      
      console.log(`   Found ${documents.length} documents via registration ID query`);
    }
    
    // Show total document count
    const totalDocs = await prisma.document.count();
    console.log(`\n📄 Total documents in database: ${totalDocs}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDocuments(); 