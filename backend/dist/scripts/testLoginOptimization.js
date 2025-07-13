"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const cache_1 = require("../config/cache");
const bcrypt_1 = require("bcrypt");
async function testLoginOptimization() {
    console.log('🔐 TESTING LOGIN OPTIMIZATION');
    console.log('============================\n');
    try {
        await prisma_1.prisma.$connect();
        console.log('✅ Database connected successfully\n');
        const testUser = await prisma_1.prisma.user.findFirst({
            select: { email: true, passwordHash: true }
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
                user = dbUser;
                if (user) {
                    cache_1.userAuthCache.set(testUser.email, user);
                }
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
        console.log('📊 TEST 3: FULL LOGIN SIMULATION (Cold Start)');
        console.log('=============================================');
        cache_1.userAuthCache.clear();
        const fullLoginStart = performance.now();
        const cacheCheckStart = performance.now();
        let loginUser = cache_1.userAuthCache.get(testUser.email);
        const cacheCheckTime = performance.now() - cacheCheckStart;
        if (!loginUser) {
            const dbStart = performance.now();
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
            const dbTime = performance.now() - dbStart;
            if (dbUser) {
                loginUser = dbUser;
                if (loginUser) {
                    cache_1.userAuthCache.set(testUser.email, loginUser);
                }
            }
            console.log(`   🔍 Database fetch: ${Math.round(dbTime)}ms`);
        }
        const passwordStart = performance.now();
        if (loginUser === null || loginUser === void 0 ? void 0 : loginUser.passwordHash) {
            await (0, bcrypt_1.compare)('testpassword', loginUser.passwordHash);
        }
        const passwordTime = performance.now() - passwordStart;
        const fullLoginDuration = performance.now() - fullLoginStart;
        console.log(`   ⚡ Cache check: ${Math.round(cacheCheckTime)}ms`);
        console.log(`   🔐 Password verification: ${Math.round(passwordTime)}ms`);
        console.log(`   🏁 Total login time: ${Math.round(fullLoginDuration)}ms\n`);
        console.log('📊 TEST 4: FULL LOGIN SIMULATION (Warm Cache)');
        console.log('=============================================');
        const warmLoginStart = performance.now();
        const warmCacheStart = performance.now();
        const warmCachedUser = cache_1.userAuthCache.get(testUser.email);
        const warmCacheTime = performance.now() - warmCacheStart;
        const warmPasswordStart = performance.now();
        if (warmCachedUser === null || warmCachedUser === void 0 ? void 0 : warmCachedUser.passwordHash) {
            await (0, bcrypt_1.compare)('testpassword', warmCachedUser.passwordHash);
        }
        const warmPasswordTime = performance.now() - warmPasswordStart;
        const warmLoginDuration = performance.now() - warmLoginStart;
        console.log(`   ⚡ Cache hit: ${Math.round(warmCacheTime)}ms`);
        console.log(`   🔐 Password verification: ${Math.round(warmPasswordTime)}ms`);
        console.log(`   🏁 Total warm login time: ${Math.round(warmLoginDuration)}ms\n`);
        console.log('🎯 LOGIN OPTIMIZATION RESULTS');
        console.log('=============================');
        console.log(`📊 Original performance: ~644ms`);
        console.log(`⚡ Cold start optimized: ${Math.round(fullLoginDuration)}ms`);
        console.log(`🚀 Warm cache optimized: ${Math.round(warmLoginDuration)}ms`);
        const coldImprovement = Math.round(((644 - fullLoginDuration) / 644) * 100);
        const warmImprovement = Math.round(((644 - warmLoginDuration) / 644) * 100);
        console.log(`📈 Cold start improvement: ${coldImprovement}%`);
        console.log(`📈 Warm cache improvement: ${warmImprovement}%`);
        console.log('\n🎯 TARGET ASSESSMENT:');
        if (warmLoginDuration < 100) {
            console.log('✅ TARGET ACHIEVED: Warm cache login < 100ms');
        }
        else {
            console.log('⚠️  Target not met: Warm cache still > 100ms');
        }
        if (fullLoginDuration < 300) {
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
//# sourceMappingURL=testLoginOptimization.js.map