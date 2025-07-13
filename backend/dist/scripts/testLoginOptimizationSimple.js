"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const cache_1 = require("../config/cache");
async function testLoginOptimization() {
    console.log('🔐 TESTING LOGIN OPTIMIZATION');
    console.log('============================\n');
    try {
        await prisma_1.prisma.$connect();
        console.log('✅ Database connected successfully\n');
        const testUser = await prisma_1.prisma.user.findFirst({
            select: {
                id: true,
                email: true,
                passwordHash: true,
                role: true,
                isActive: true,
                mustChangePassword: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!testUser) {
            console.log('❌ No test user found in database');
            return;
        }
        console.log(`🧪 Testing with user: ${testUser.email}\n`);
        cache_1.userAuthCache.clear();
        console.log('🗑️  Cache cleared for fresh testing\n');
        console.log('📊 TEST 1: COLD START (Database Fetch)');
        console.log('=====================================');
        const coldStart = performance.now();
        let user = cache_1.userAuthCache.get(testUser.email);
        if (!user) {
            console.log('🔍 Cache miss - fetching from database...');
            const dbStartTime = performance.now();
            const dbUser = await prisma_1.prisma.user.findUnique({
                where: { email: testUser.email },
                select: {
                    id: true,
                    email: true,
                    passwordHash: true,
                    role: true,
                    isActive: true,
                    mustChangePassword: true,
                    lastLogin: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            const dbFetchTime = performance.now() - dbStartTime;
            console.log(`   ⚡ Database fetch: ${Math.round(dbFetchTime)}ms`);
            if (dbUser) {
                cache_1.userAuthCache.set(testUser.email, dbUser);
                console.log('   💾 User cached for future requests');
            }
        }
        const coldDuration = performance.now() - coldStart;
        console.log(`   🏁 Total cold start time: ${Math.round(coldDuration)}ms\n`);
        console.log('📊 TEST 2: WARM CACHE (Cache Hit)');
        console.log('=================================');
        const warmStart = performance.now();
        const cachedUser = cache_1.userAuthCache.get(testUser.email);
        if (cachedUser) {
            console.log('⚡ User served from cache');
        }
        const warmDuration = performance.now() - warmStart;
        console.log(`   🏁 Cache hit time: ${Math.round(warmDuration)}ms\n`);
        console.log('📊 TEST 3: MULTIPLE CACHE HITS');
        console.log('==============================');
        const hitTimes = [];
        for (let i = 0; i < 5; i++) {
            const hitStart = performance.now();
            const hitUser = cache_1.userAuthCache.get(testUser.email);
            const hitDuration = performance.now() - hitStart;
            hitTimes.push(hitDuration);
            if (hitUser) {
                console.log(`   Hit ${i + 1}: ${Math.round(hitDuration)}ms`);
            }
        }
        const avgHitTime = hitTimes.reduce((sum, time) => sum + time, 0) / hitTimes.length;
        console.log(`   📊 Average cache hit time: ${Math.round(avgHitTime)}ms\n`);
        console.log('🎯 LOGIN OPTIMIZATION RESULTS');
        console.log('=============================');
        console.log(`📊 Original performance: ~644ms`);
        console.log(`⚡ Cold start optimized: ${Math.round(coldDuration)}ms`);
        console.log(`🚀 Warm cache optimized: ${Math.round(warmDuration)}ms`);
        console.log(`🚀 Average cache hit: ${Math.round(avgHitTime)}ms`);
        const coldImprovement = Math.round(((644 - coldDuration) / 644) * 100);
        const warmImprovement = Math.round(((644 - warmDuration) / 644) * 100);
        console.log(`📈 Cold start improvement: ${coldImprovement}%`);
        console.log(`📈 Warm cache improvement: ${warmImprovement}%`);
        console.log('\n🎯 TARGET ASSESSMENT:');
        if (warmDuration < 100) {
            console.log('✅ TARGET ACHIEVED: Warm cache login < 100ms');
        }
        else {
            console.log('⚠️  Target not met: Warm cache still > 100ms');
        }
        if (coldDuration < 300) {
            console.log('✅ GOOD: Cold start login < 300ms');
        }
        else {
            console.log('⚠️  Cold start still > 300ms - may need further optimization');
        }
        console.log('\n📊 CACHE STATISTICS:');
        const stats = cache_1.userAuthCache.getStats();
        console.log(`   Cached users: ${stats.activeEntries}`);
        console.log(`   Cache hit rate: ${Math.round(stats.hitRate)}%`);
        console.log(`   Memory usage: ~${stats.memoryUsage} bytes`);
        console.log('\n✅ Login optimization testing completed!');
        cache_1.userAuthCache.clear();
    }
    catch (error) {
        console.error('❌ Login optimization test failed:', error);
        throw error;
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
}
if (require.main === module) {
    testLoginOptimization()
        .then(() => {
        console.log('\n🎉 Login optimization test completed!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Login optimization test failed:', error);
        process.exit(1);
    });
}
exports.default = testLoginOptimization;
//# sourceMappingURL=testLoginOptimizationSimple.js.map