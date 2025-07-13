"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const performanceMonitor_1 = __importDefault(require("../middleware/performanceMonitor"));
const prisma = new client_1.PrismaClient();
class PerformanceTestFramework {
    constructor() {
        this.baselines = new Map();
        this.tests = [
            {
                name: 'User Login Query',
                category: 'auth',
                testFunction: async () => {
                    const start = performance.now();
                    await prisma.user.findUnique({
                        where: { email: 'test@example.com' },
                        select: { id: true, email: true, passwordHash: true, role: true, isActive: true }
                    });
                    return performance.now() - start;
                },
                expectedThreshold: 100,
                criticalThreshold: 500
            },
            {
                name: 'Student List Query',
                category: 'students',
                testFunction: async () => {
                    const start = performance.now();
                    await prisma.student.findMany({
                        take: 10,
                        include: {
                            department: { select: { name: true } },
                            faculty: { select: { name: true } },
                            academicYear: { select: { academicYear: true } }
                        }
                    });
                    return performance.now() - start;
                },
                expectedThreshold: 200,
                criticalThreshold: 800
            },
            {
                name: 'Dashboard Stats Query',
                category: 'reports',
                testFunction: async () => {
                    const start = performance.now();
                    await prisma.$queryRaw `
          SELECT 
            COUNT(*)::int as total_students,
            COUNT(CASE WHEN gender = 'MALE' THEN 1 END)::int as male_students,
            COUNT(CASE WHEN gender = 'FEMALE' THEN 1 END)::int as female_students
          FROM students
        `;
                    return performance.now() - start;
                },
                expectedThreshold: 150,
                criticalThreshold: 600
            },
            {
                name: 'Audit Log Query',
                category: 'audit',
                testFunction: async () => {
                    const start = performance.now();
                    await prisma.auditLog.findMany({
                        take: 20,
                        include: {
                            user: { select: { email: true, role: true } }
                        },
                        orderBy: { timestamp: 'desc' }
                    });
                    return performance.now() - start;
                },
                expectedThreshold: 200,
                criticalThreshold: 1000
            },
            {
                name: 'User Management Query',
                category: 'admin',
                testFunction: async () => {
                    const start = performance.now();
                    await prisma.user.findMany({
                        select: { id: true, email: true, role: true, isActive: true, lastLogin: true }
                    });
                    return performance.now() - start;
                },
                expectedThreshold: 100,
                criticalThreshold: 400
            }
        ];
    }
    async runBaselineTests() {
        console.log('🏁 Running Performance Baseline Tests...\n');
        const results = [];
        for (const test of this.tests) {
            try {
                console.log(`Testing: ${test.name}...`);
                const runs = [];
                for (let i = 0; i < 3; i++) {
                    const duration = await test.testFunction();
                    runs.push(duration);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                const avgDuration = Math.round(runs.reduce((sum, run) => sum + run, 0) / runs.length);
                this.baselines.set(test.name, avgDuration);
                let status;
                if (avgDuration <= test.expectedThreshold)
                    status = 'excellent';
                else if (avgDuration <= test.expectedThreshold * 1.5)
                    status = 'good';
                else if (avgDuration <= test.criticalThreshold)
                    status = 'slow';
                else
                    status = 'critical';
                const result = {
                    testName: test.name,
                    category: test.category,
                    duration: avgDuration,
                    status
                };
                results.push(result);
                console.log(`  ✓ ${avgDuration}ms (${status.toUpperCase()})`);
            }
            catch (error) {
                console.error(`  ✗ Failed: ${error}`);
                results.push({
                    testName: test.name,
                    category: test.category,
                    duration: -1,
                    status: 'critical'
                });
            }
        }
        this.printBaselineReport(results);
        return results;
    }
    async runComparisonTests() {
        console.log('📊 Running Performance Comparison Tests...\n');
        const results = [];
        for (const test of this.tests) {
            try {
                const baseline = this.baselines.get(test.name);
                if (!baseline) {
                    console.log(`⚠️  No baseline for ${test.name}, skipping comparison`);
                    continue;
                }
                console.log(`Testing: ${test.name}...`);
                const runs = [];
                for (let i = 0; i < 3; i++) {
                    const duration = await test.testFunction();
                    runs.push(duration);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                const avgDuration = Math.round(runs.reduce((sum, run) => sum + run, 0) / runs.length);
                const improvement = Math.round(((baseline - avgDuration) / baseline) * 100);
                let status;
                if (avgDuration <= test.expectedThreshold)
                    status = 'excellent';
                else if (avgDuration <= test.expectedThreshold * 1.5)
                    status = 'good';
                else if (avgDuration <= test.criticalThreshold)
                    status = 'slow';
                else
                    status = 'critical';
                const result = {
                    testName: test.name,
                    category: test.category,
                    duration: avgDuration,
                    status,
                    improvement
                };
                results.push(result);
                const improvementStr = improvement > 0 ? `+${improvement}%` : `${improvement}%`;
                const trendIcon = improvement > 0 ? '📈' : improvement < 0 ? '📉' : '➡️';
                console.log(`  ✓ ${avgDuration}ms (${status.toUpperCase()}) ${trendIcon} ${improvementStr} vs baseline`);
            }
            catch (error) {
                console.error(`  ✗ Failed: ${error}`);
            }
        }
        this.printComparisonReport(results);
        return results;
    }
    async testQuery(name, queryFn) {
        const runs = [];
        for (let i = 0; i < 5; i++) {
            const start = performance.now();
            await queryFn();
            runs.push(performance.now() - start);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        const avgDuration = Math.round(runs.reduce((sum, run) => sum + run, 0) / runs.length);
        console.log(`🔍 ${name}: ${avgDuration}ms (avg of 5 runs)`);
        return avgDuration;
    }
    getSystemStats() {
        return performanceMonitor_1.default.getStats();
    }
    printBaselineReport(results) {
        console.log('\n📋 BASELINE PERFORMANCE REPORT');
        console.log('================================');
        const byCategory = results.reduce((acc, result) => {
            if (!acc[result.category])
                acc[result.category] = [];
            acc[result.category].push(result);
            return acc;
        }, {});
        Object.entries(byCategory).forEach(([category, tests]) => {
            console.log(`\n${category.toUpperCase()}:`);
            tests.forEach(test => {
                const icon = test.status === 'excellent' ? '🟢' :
                    test.status === 'good' ? '🟡' :
                        test.status === 'slow' ? '🟠' : '🔴';
                console.log(`  ${icon} ${test.testName}: ${test.duration}ms`);
            });
        });
        const criticalCount = results.filter(r => r.status === 'critical').length;
        const slowCount = results.filter(r => r.status === 'slow').length;
        if (criticalCount > 0) {
            console.log(`\n🚨 ${criticalCount} CRITICAL performance issues found!`);
        }
        if (slowCount > 0) {
            console.log(`\n⚠️  ${slowCount} SLOW performance issues found`);
        }
        console.log('\n');
    }
    printComparisonReport(results) {
        console.log('\n📊 PERFORMANCE COMPARISON REPORT');
        console.log('=================================');
        const improvements = results.filter(r => r.improvement && r.improvement > 0);
        const regressions = results.filter(r => r.improvement && r.improvement < 0);
        if (improvements.length > 0) {
            console.log('\n🎉 IMPROVEMENTS:');
            improvements.forEach(result => {
                console.log(`  📈 ${result.testName}: +${result.improvement}% (${result.duration}ms)`);
            });
        }
        if (regressions.length > 0) {
            console.log('\n⚠️  REGRESSIONS:');
            regressions.forEach(result => {
                console.log(`  📉 ${result.testName}: ${result.improvement}% (${result.duration}ms)`);
            });
        }
        const avgImprovement = results
            .filter(r => r.improvement !== undefined)
            .reduce((sum, r) => sum + (r.improvement || 0), 0) / results.length;
        console.log(`\n📊 OVERALL PERFORMANCE CHANGE: ${avgImprovement > 0 ? '+' : ''}${Math.round(avgImprovement)}%`);
        console.log('\n');
    }
}
exports.default = PerformanceTestFramework;
//# sourceMappingURL=performanceTestFramework.js.map