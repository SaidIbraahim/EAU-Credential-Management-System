"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function completeDocumentIndexes() {
    console.log('📄 COMPLETING DOCUMENT MANAGEMENT INDEXES');
    console.log('========================================\n');
    try {
        console.log('📊 Applying remaining document indexes...\n');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_registration_id 
      ON documents(registration_id);
    `;
        console.log('   ✅ Document by student ID index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_type_date 
      ON documents(document_type, upload_date DESC);
    `;
        console.log('   ✅ Document type and date index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_upload_date 
      ON documents(upload_date DESC);
    `;
        console.log('   ✅ Document upload date index\n');
        console.log('🎉 DOCUMENT INDEXES COMPLETED SUCCESSFULLY!');
        console.log('==========================================');
        console.log('✅ All performance indexes are now applied!\n');
    }
    catch (error) {
        console.error('❌ Error completing document indexes:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    completeDocumentIndexes()
        .then(() => {
        console.log('🚀 Document index completion successful!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Document index completion failed:', error);
        process.exit(1);
    });
}
exports.default = completeDocumentIndexes;
//# sourceMappingURL=completeDocumentIndexes.js.map