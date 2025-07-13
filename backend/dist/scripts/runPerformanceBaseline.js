"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const performanceTestFramework_1 = __importDefault(require("../utils/performanceTestFramework"));
const prisma_1 = require("../lib/prisma");
async function runBaseline() {
    console.log('🎯 EAU CREDENTIAL SYSTEM - PERFORMANCE BASELINE ANALYSIS');
    console.log('========================================================\n');
    const framework = new performanceTestFramework_1.default();
    try {
        console.log('🔗 Testing database connection...');
        await prisma_1.prisma.$connect();
        console.log('✅ Database connected successfully\n');
        const results = await framework.runBaselineTests();
        console.log('📊 Getting system performance statistics...');
        const systemStats = framework.getSystemStats();
        console.log('\n🔍 SYSTEM PERFORMANCE OVERVIEW:');
        console.log(`- Total requests tracked: ${systemStats.summary.totalRequests}`);
        console.log(`- Average response time (1h): ${systemStats.summary.avgDuration1Hour}ms`);
        console.log(`- Slow queries (1h): ${systemStats.summary.slowQueries1Hour}`);
        console.log(`- Slow query threshold: ${systemStats.summary.slowQueryThreshold}ms`);
        if (systemStats.slowestEndpoints.length > 0) {
            console.log('\n🐌 SLOWEST ENDPOINTS:');
            systemStats.slowestEndpoints.slice(0, 5).forEach(endpoint => {
                console.log(`  - ${endpoint.endpoint}: ${Math.round(endpoint.avgDuration)}ms avg`);
            });
        }
        console.log('\n🎯 OPTIMIZATION PRIORITIES:');
        const criticalIssues = results.filter(r => r.status === 'critical');
        const slowIssues = results.filter(r => r.status === 'slow');
        if (criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES (Immediate Action Required):');
            criticalIssues.forEach(issue => {
                console.log(`  🔴 ${issue.testName} (${issue.category}): ${issue.duration}ms`);
            });
        }
        if (slowIssues.length > 0) {
            console.log('\n⚠️  SLOW ISSUES (Should be optimized):');
            slowIssues.forEach(issue => {
                console.log(`  🟠 ${issue.testName} (${issue.category}): ${issue.duration}ms`);
            });
        }
        console.log('\n💡 RECOMMENDED OPTIMIZATION ORDER:');
        console.log('1. 🗂️  Database Indexes (Safest, High Impact)');
        console.log('2. 🔍 Query Optimization (Medium Risk, High Impact)');
        console.log('3. 📱 Frontend Caching (Low Risk, Medium Impact)');
        console.log('4. 🔐 Auth Optimization (Medium Risk, Medium Impact)');
        console.log('5. 📊 Advanced Features (Higher Risk, Variable Impact)');
        console.log('\n✅ Baseline analysis complete! Ready for optimizations.');
        console.log('\n💾 Saving baseline results for future comparison...');
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const baselineData = {
            timestamp: new Date().toISOString(),
            results,
            systemStats
        };
        fs.writeFileSync('performance-baseline.json', JSON.stringify(baselineData, null, 2));
        console.log('✅ Baseline saved to performance-baseline.json');
    }
    catch (error) {
        console.error('❌ Baseline analysis failed:', error);
        process.exit(1);
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
}
if (require.main === module) {
    runBaseline().catch(console.error);
}
exports.default = runBaseline;
//# sourceMappingURL=runPerformanceBaseline.js.map