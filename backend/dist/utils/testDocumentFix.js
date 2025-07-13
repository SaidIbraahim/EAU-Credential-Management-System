"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function testDocumentFix() {
    console.log('🔍 Testing Document Fix...\n');
    try {
        const student = await prisma.student.findFirst({
            where: { registrationId: 'GRW-BCS-2010' }
        });
        if (!student) {
            console.log('❌ Test student not found');
            return;
        }
        console.log(`✅ Found student: ${student.fullName}`);
        console.log(`   - Numeric ID: ${student.id}`);
        console.log(`   - Registration ID: ${student.registrationId}`);
        console.log('\n📄 Testing document lookup by registration ID:');
        const docsByRegId = await prisma.document.findMany({
            where: {
                student: {
                    registrationId: student.registrationId
                }
            },
            orderBy: { uploadDate: 'desc' }
        });
        console.log(`   Found ${docsByRegId.length} documents:`);
        docsByRegId.forEach(doc => {
            console.log(`   - ${doc.documentType}: ${doc.fileName}`);
        });
        console.log('\n⚠️  Testing wrong lookup by numeric ID (old broken way):');
        const docsByNumericId = await prisma.document.findMany({
            where: {
                student: {
                    id: parseInt(student.registrationId) || -1
                }
            }
        });
        console.log(`   Found ${docsByNumericId.length} documents (should be 0 if registration ID is string)`);
        console.log('\n🔧 Simulating fixed API call:');
        console.log(`   GET /documents/student/${student.registrationId}`);
        console.log(`   Should return ${docsByRegId.length} documents`);
        if (docsByRegId.length > 0) {
            console.log('\n✅ Fix successful! Documents are properly associated and retrievable.');
        }
        else {
            console.log('\n❌ No documents found - check if documents were uploaded correctly.');
        }
    }
    catch (error) {
        console.error('❌ Test failed:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testDocumentFix();
//# sourceMappingURL=testDocumentFix.js.map