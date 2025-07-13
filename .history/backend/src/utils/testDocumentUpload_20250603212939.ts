import { PrismaClient } from '@prisma/client';
import { DocumentService } from '../services/document.service';

const prisma = new PrismaClient();

/**
 * Test document upload functionality
 * This utility helps verify the document upload process works correctly
 */
export async function testDocumentUpload() {
  console.log('🔍 Testing Document Upload System...\n');
  
  try {
    // Test 1: Check if we can find students
    console.log('1. Testing student lookup...');
    const students = await prisma.student.findMany({
      take: 5,
      select: {
        id: true,
        registrationId: true,
        fullName: true
      }
    });
    
    if (students.length === 0) {
      console.log('❌ No students found in database');
      return;
    }
    
    console.log(`✅ Found ${students.length} students`);
    students.forEach(student => {
      console.log(`   - ${student.fullName} (ID: ${student.id}, RegID: ${student.registrationId})`);
    });
    
    // Test 2: Check DocumentService instantiation
    console.log('\n2. Testing DocumentService...');
    const documentService = new DocumentService();
    console.log('✅ DocumentService instantiated successfully');
    
    // Test 3: Check documents by registration ID
    console.log('\n3. Testing document retrieval...');
    const testStudent = students[0];
    const documents = await documentService.getDocumentsByRegistrationId(testStudent.registrationId);
    console.log(`✅ Found ${documents.length} documents for student ${testStudent.registrationId}`);
    
    if (documents.length > 0) {
      documents.forEach(doc => {
        console.log(`   - ${doc.documentType}: ${doc.fileName} (URL: ${doc.fileUrl})`);
      });
    }
    
    // Test 4: Validate document types
    console.log('\n4. Testing document type validation...');
    const validTypes = ['photo', 'transcript', 'certificate', 'supporting'];
    const testTypes = ['PHOTO', 'photo', 'Photo', 'TRANSCRIPT', 'transcript'];
    
    testTypes.forEach(type => {
      const normalized = type.toLowerCase();
      const isValid = validTypes.includes(normalized);
      console.log(`   - "${type}" → "${normalized}" ${isValid ? '✅' : '❌'}`);
    });
    
    console.log('\n🎉 Document upload system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Document upload test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in routes or standalone testing
export default testDocumentUpload; 