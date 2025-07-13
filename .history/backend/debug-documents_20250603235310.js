const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocuments() {
  try {
    const documents = await prisma.document.findMany({
      include: { student: true },
      take: 5
    });
    
    console.log('Sample documents:');
    documents.forEach(doc => {
      console.log(`ID: ${doc.id}, Type: ${doc.documentType}`);
      console.log(`File URL: ${doc.fileUrl}`);
      console.log(`Student: ${doc.student?.name} (${doc.student?.registrationId})`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocuments(); 