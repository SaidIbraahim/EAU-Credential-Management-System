"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function testDocumentQuery() {
    console.log('🔍 Testing Document Query...\n');
    try {
        const registrationId = 'GRW-BCS-2010';
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
            var _a;
            console.log(`- ${doc.documentType}: ${doc.fileName}`);
            console.log(`  Student: ${(_a = doc.student) === null || _a === void 0 ? void 0 : _a.fullName}`);
            console.log(`  Upload Date: ${doc.uploadDate}`);
            console.log(`  URL: ${doc.fileUrl}\n`);
        });
        if (documents.length === 0) {
            console.log('❌ No documents found - this might be the issue!');
        }
        else {
            console.log('✅ Documents found - query works correctly');
        }
    }
    catch (error) {
        console.error('❌ Query failed:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testDocumentQuery();
//# sourceMappingURL=testDocumentQuery.js.map