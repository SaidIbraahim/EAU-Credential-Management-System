"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugDocuments = debugDocuments;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function debugDocuments() {
    console.log('🔍 Debugging Document Database Issues...\n');
    try {
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
            var _a;
            console.log(`   - ${doc.documentType}: ${doc.fileName}`);
            console.log(`     Student ID: ${doc.registrationId}, Student: ${((_a = doc.student) === null || _a === void 0 ? void 0 : _a.fullName) || 'NOT FOUND'}`);
            console.log(`     Upload Date: ${doc.uploadDate}`);
            console.log(`     URL: ${doc.fileUrl}\n`);
        });
        console.log('3. Checking for association issues:');
        const allStudentIds = await prisma.student.findMany({
            select: { id: true }
        });
        const validStudentIds = allStudentIds.map(s => s.id);
        const potentialOrphans = allDocuments.filter(doc => !validStudentIds.includes(doc.registrationId));
        if (potentialOrphans.length > 0) {
            console.log(`   ❌ Found ${potentialOrphans.length} potentially orphaned documents!`);
            potentialOrphans.forEach(doc => {
                console.log(`      - ${doc.fileName} (registrationId: ${doc.registrationId} - not found in students)`);
            });
        }
        else {
            console.log(`   ✅ No orphaned documents found`);
        }
        if (recentStudents.length > 0) {
            const testStudent = recentStudents[0];
            console.log(`\n4. Testing document lookup for ${testStudent.fullName}:`);
            const docsByStudentId = await prisma.document.findMany({
                where: { registrationId: testStudent.id }
            });
            console.log(`   Method 1 (by student ID ${testStudent.id}): ${docsByStudentId.length} documents`);
            const docsByRegId = await prisma.document.findMany({
                where: {
                    student: {
                        registrationId: testStudent.registrationId
                    }
                }
            });
            console.log(`   Method 2 (by registration string ${testStudent.registrationId}): ${docsByRegId.length} documents`);
        }
    }
    catch (error) {
        console.error('❌ Database debug failed:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    debugDocuments();
}
//# sourceMappingURL=debugDatabase.js.map