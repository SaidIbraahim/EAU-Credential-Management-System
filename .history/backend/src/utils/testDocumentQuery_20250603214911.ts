import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDocumentQuery() {
  console.log('🔍 Testing Document Query...\n');
  
  try {
    // Test the exact query the API should be using
    const registrationId = 'GRW-BCS-2010'; // From our debug output
    console.log(`Looking for documents for student: ${registrationId}`);
    
    const documents = await prisma.document.findMany({
      where: { 
        student: {
          registrationId: registrationId
        }
      },
      include: {
        student: true
      },
      orderBy: { uploadDate: 'desc' }
    });
    
    console.log(`Found ${documents.length} documents:`);
    documents.forEach(doc => {
      console.log(`- ${doc.documentType}: ${doc.fileName}`);
      console.log(`  Student: ${doc.student?.fullName}`);
      console.log(`  Upload Date: ${doc.uploadDate}`);
      console.log(`  URL: ${doc.fileUrl}\n`);
    });
    
    if (documents.length === 0) {
      console.log('❌ No documents found - this might be the issue!');
    } else {
      console.log('✅ Documents found - query works correctly');
    }
    
  } catch (error) {
    console.error('❌ Query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDocumentQuery(); 