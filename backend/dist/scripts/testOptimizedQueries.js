"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const student_controller_optimized_1 = __importDefault(require("../controllers/optimized/student.controller.optimized"));
async function testOptimizedQueries() {
    console.log('🔍 TESTING OPTIMIZED QUERY PERFORMANCE');
    console.log('=====================================\n');
    try {
        await prisma_1.prisma.$connect();
        console.log('✅ Database connected successfully\n');
        console.log('📚 1. TESTING OPTIMIZED STUDENT LIST QUERY...');
        const studentListStart = performance.now();
        const mockReq = { query: { page: '1', limit: '10' } };
        const mockRes = {
            json: () => { },
            status: () => ({ json: () => { } })
        };
        await student_controller_optimized_1.default.getAll(mockReq, mockRes);
        const studentListDuration = performance.now() - studentListStart;
        console.log(`   ⚡ Duration: ${Math.round(studentListDuration)}ms\n`);
        console.log('🔍 2. TESTING OPTIMIZED STUDENT SEARCH...');
        const searchStart = performance.now();
        const searchReq = { query: { query: 'john', page: '1', limit: '10' } };
        await student_controller_optimized_1.default.search(searchReq, mockRes);
        const searchDuration = performance.now() - searchStart;
        console.log(`   ⚡ Duration: ${Math.round(searchDuration)}ms\n`);
        console.log('🔧 3. TESTING RAW QUERY OPTIMIZATIONS...');
        console.log('   Testing ORIGINAL query with full includes...');
        const originalStart = performance.now();
        await prisma_1.prisma.student.findMany({
            take: 10,
            include: {
                department: true,
                faculty: true,
                academicYear: true
            },
            orderBy: { createdAt: 'desc' }
        });
        const originalDuration = performance.now() - originalStart;
        console.log(`   📊 Original query: ${Math.round(originalDuration)}ms`);
        console.log('   Testing OPTIMIZED query with selective fields...');
        const optimizedStart = performance.now();
        await prisma_1.prisma.student.findMany({
            take: 10,
            select: {
                id: true,
                registrationId: true,
                fullName: true,
                status: true,
                department: { select: { name: true } },
                faculty: { select: { name: true } },
                academicYear: { select: { academicYear: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        const optimizedDuration = performance.now() - optimizedStart;
        console.log(`   ⚡ Optimized query: ${Math.round(optimizedDuration)}ms`);
        const improvement = Math.round(((originalDuration - optimizedDuration) / originalDuration) * 100);
        console.log(`   📈 Improvement: ${improvement}%\n`);
        console.log('🔐 4. TESTING USER AUTHENTICATION OPTIMIZATION...');
        const testUser = await prisma_1.prisma.user.findFirst({
            select: { email: true }
        });
        let userImprovement = 0;
        if (testUser) {
            console.log('   Testing ORIGINAL user query...');
            const userOriginalStart = performance.now();
            await prisma_1.prisma.user.findUnique({
                where: { email: testUser.email },
                include: { auditLogs: true }
            });
            const userOriginalDuration = performance.now() - userOriginalStart;
            console.log(`   📊 Original user query: ${Math.round(userOriginalDuration)}ms`);
            console.log('   Testing OPTIMIZED user query...');
            const userOptimizedStart = performance.now();
            await prisma_1.prisma.user.findUnique({
                where: { email: testUser.email },
                select: {
                    id: true,
                    email: true,
                    passwordHash: true,
                    role: true,
                    isActive: true,
                    mustChangePassword: true,
                    lastLogin: true
                }
            });
            const userOptimizedDuration = performance.now() - userOptimizedStart;
            console.log(`   ⚡ Optimized user query: ${Math.round(userOptimizedDuration)}ms`);
            userImprovement = Math.round(((userOriginalDuration - userOptimizedDuration) / userOriginalDuration) * 100);
            console.log(`   📈 User query improvement: ${userImprovement}%\n`);
        }
        console.log('📋 5. TESTING AUDIT LOG OPTIMIZATION...');
        console.log('   Testing ORIGINAL audit query...');
        const auditOriginalStart = performance.now();
        await prisma_1.prisma.auditLog.findMany({
            take: 20,
            include: {
                user: true
            },
            orderBy: { timestamp: 'desc' }
        });
        const auditOriginalDuration = performance.now() - auditOriginalStart;
        console.log(`   📊 Original audit query: ${Math.round(auditOriginalDuration)}ms`);
        console.log('   Testing OPTIMIZED audit query...');
        const auditOptimizedStart = performance.now();
        await prisma_1.prisma.auditLog.findMany({
            take: 20,
            select: {
                id: true,
                action: true,
                resourceType: true,
                timestamp: true,
                user: {
                    select: { email: true, role: true }
                }
            },
            orderBy: { timestamp: 'desc' }
        });
        const auditOptimizedDuration = performance.now() - auditOptimizedStart;
        console.log(`   ⚡ Optimized audit query: ${Math.round(auditOptimizedDuration)}ms`);
        const auditImprovement = Math.round(((auditOriginalDuration - auditOptimizedDuration) / auditOriginalDuration) * 100);
        console.log(`   📈 Audit query improvement: ${auditImprovement}%\n`);
        console.log('📊 OPTIMIZATION SUMMARY:');
        console.log('========================');
        console.log(`🎓 Student List Improvement: ${improvement}%`);
        if (testUser) {
            console.log(`🔐 User Query Improvement: ${userImprovement}%`);
        }
        console.log(`📋 Audit Log Improvement: ${auditImprovement}%`);
        const avgImprovement = testUser
            ? Math.round((improvement + userImprovement + auditImprovement) / 3)
            : Math.round((improvement + auditImprovement) / 2);
        console.log(`📈 Average Query Improvement: ${avgImprovement}%`);
        console.log('\n✅ Query optimization tests completed successfully!');
        console.log('\n💡 NEXT STEPS:');
        console.log('1. Replace original controllers with optimized versions');
        console.log('2. Update routes to use optimized controllers');
        console.log('3. Run full performance comparison test');
        console.log('4. Monitor production performance metrics\n');
    }
    catch (error) {
        console.error('❌ Query optimization test failed:', error);
        throw error;
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
}
if (require.main === module) {
    testOptimizedQueries()
        .then(() => {
        console.log('🚀 Query optimization testing complete!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Query optimization testing failed:', error);
        process.exit(1);
    });
}
exports.default = testOptimizedQueries;
//# sourceMappingURL=testOptimizedQueries.js.map