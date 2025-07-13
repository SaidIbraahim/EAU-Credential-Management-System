"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationTester = void 0;
const client_1 = require("@prisma/client");
const perf_hooks_1 = require("perf_hooks");
const PerformanceMonitoringService_1 = __importDefault(require("../services/PerformanceMonitoringService"));
const ReportingService_1 = __importDefault(require("../services/ReportingService"));
const prisma = new client_1.PrismaClient();
class OptimizationTester {
    constructor() {
        this.results = [];
        this.performanceMonitor = PerformanceMonitoringService_1.default.getInstance();
        this.performanceMonitor.setupPrismaMiddleware(prisma);
        this.reportingService = ReportingService_1.default.getInstance(prisma);
    }
    getPerformanceTests() {
        return [
            {
                name: 'Student Registration Validation',
                operation: async () => {
                    return await prisma.student.findMany({
                        where: {
                            OR: [
                                { registrationId: 'TEST-REG-001' },
                                { certificateId: 'TEST-CERT-001' }
                            ]
                        },
                        select: { id: true, registrationId: true, certificateId: true }
                    });
                },
                expectedMaxTime: 50,
                description: 'Fast duplicate checking with indexed fields'
            },
            {
                name: 'Dashboard Metrics Loading',
                operation: async () => {
                    return await this.reportingService.getDashboardMetrics();
                },
                expectedMaxTime: 2000,
                description: 'Cached dashboard metrics with parallel aggregations'
            },
            {
                name: 'Student Search (No Filter)',
                operation: async () => {
                    return await this.reportingService.searchStudents({
                        page: 1,
                        limit: 20
                    });
                },
                expectedMaxTime: 500,
                description: 'Paginated student search with optimized indexes'
            },
            {
                name: 'Student Search (Status Filter)',
                operation: async () => {
                    return await this.reportingService.searchStudents({
                        status: 'CLEARED',
                        page: 1,
                        limit: 20
                    });
                },
                expectedMaxTime: 300,
                description: 'Status-filtered search using partial indexes'
            },
            {
                name: 'Student Search (Text Query)',
                operation: async () => {
                    return await this.reportingService.searchStudents({
                        query: 'John',
                        page: 1,
                        limit: 20
                    });
                },
                expectedMaxTime: 800,
                description: 'Text search with full-text indexes'
            },
            {
                name: 'Student Analytics Generation',
                operation: async () => {
                    return await this.reportingService.getStudentAnalytics();
                },
                expectedMaxTime: 1500,
                description: 'Complex analytics with optimized aggregations'
            },
            {
                name: 'Document Insights Loading',
                operation: async () => {
                    return await this.reportingService.getDocumentInsights();
                },
                expectedMaxTime: 1000,
                description: 'Document statistics with cached results'
            },
            {
                name: 'Student Count by Status',
                operation: async () => {
                    return await Promise.all([
                        prisma.student.count({ where: { status: 'CLEARED' } }),
                        prisma.student.count({ where: { status: 'UN_CLEARED' } })
                    ]);
                },
                expectedMaxTime: 100,
                description: 'Status counting with partial indexes'
            },
            {
                name: 'Recent Students Query',
                operation: async () => {
                    return await prisma.student.findMany({
                        select: {
                            id: true,
                            registrationId: true,
                            fullName: true,
                            status: true,
                            createdAt: true
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    });
                },
                expectedMaxTime: 100,
                description: 'Recent students with created_at index'
            },
            {
                name: 'Document Upload Query',
                operation: async () => {
                    return await prisma.document.findMany({
                        where: {
                            registrationId: { in: [1, 2, 3, 4, 5] }
                        },
                        select: {
                            id: true,
                            documentType: true,
                            fileName: true,
                            uploadDate: true
                        },
                        orderBy: { uploadDate: 'desc' }
                    });
                },
                expectedMaxTime: 150,
                description: 'Document queries with compound indexes'
            }
        ];
    }
    async runTest(test) {
        console.log(`\n🧪 Running: ${test.name}`);
        console.log(`📝 ${test.description}`);
        console.log(`⏱️  Expected max time: ${test.expectedMaxTime}ms`);
        const startTime = perf_hooks_1.performance.now();
        let data;
        let error = null;
        try {
            data = await test.operation();
        }
        catch (err) {
            error = err;
        }
        const endTime = perf_hooks_1.performance.now();
        const duration = endTime - startTime;
        const passed = !error && duration <= test.expectedMaxTime;
        const result = {
            name: test.name,
            duration: Math.round(duration * 100) / 100,
            passed,
            expectedMaxTime: test.expectedMaxTime,
            description: test.description,
            data: error ? null : data
        };
        const baseline = test.expectedMaxTime * 2;
        const improvementPercent = Math.round(((baseline - duration) / baseline) * 100);
        if (improvementPercent > 0) {
            result.improvement = `${improvementPercent}% faster`;
        }
        console.log(`⏱️  Actual time: ${result.duration}ms`);
        console.log(`${passed ? '✅' : '❌'} ${passed ? 'PASSED' : 'FAILED'}`);
        if (result.improvement) {
            console.log(`📈 Performance: ${result.improvement} than baseline`);
        }
        if (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        return result;
    }
    async runAllTests() {
        console.log('🚀 STARTING COMPREHENSIVE PERFORMANCE TESTING');
        console.log('='.repeat(60));
        const tests = this.getPerformanceTests();
        const startTime = perf_hooks_1.performance.now();
        for (const test of tests) {
            const result = await this.runTest(test);
            this.results.push(result);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const totalTime = perf_hooks_1.performance.now() - startTime;
        console.log('\n' + '='.repeat(60));
        console.log('📊 PERFORMANCE TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        this.printResultsSummary(totalTime);
        return this.results;
    }
    printResultsSummary(totalTime) {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const totalTests = this.results.length;
        console.log(`\n🎯 OVERALL RESULTS:`);
        console.log(`   ✅ Passed: ${passed}/${totalTests} (${Math.round((passed / totalTests) * 100)}%)`);
        console.log(`   ❌ Failed: ${failed}/${totalTests} (${Math.round((failed / totalTests) * 100)}%)`);
        console.log(`   ⏱️  Total time: ${Math.round(totalTime)}ms`);
        console.log(`\n📈 PERFORMANCE BREAKDOWN:`);
        this.results.forEach(result => {
            const statusIcon = result.passed ? '✅' : '❌';
            const timeStatus = result.duration <= result.expectedMaxTime ? '🟢' : '🔴';
            console.log(`   ${statusIcon} ${timeStatus} ${result.name}`);
            console.log(`      ⏱️  ${result.duration}ms (max: ${result.expectedMaxTime}ms)`);
            if (result.improvement) {
                console.log(`      📈 ${result.improvement}`);
            }
            if (!result.passed) {
                const overtime = result.duration - result.expectedMaxTime;
                console.log(`      ⚠️  Exceeded by ${Math.round(overtime)}ms`);
            }
            console.log('');
        });
        const excellent = this.results.filter(r => r.duration < r.expectedMaxTime * 0.5).length;
        const good = this.results.filter(r => r.duration < r.expectedMaxTime && r.duration >= r.expectedMaxTime * 0.5).length;
        const acceptable = this.results.filter(r => r.duration <= r.expectedMaxTime * 1.2 && r.duration >= r.expectedMaxTime).length;
        const poor = this.results.filter(r => r.duration > r.expectedMaxTime * 1.2).length;
        console.log(`\n🎨 PERFORMANCE CATEGORIES:`);
        console.log(`   🟢 Excellent (< 50% of expected): ${excellent}`);
        console.log(`   🔵 Good (50-100% of expected): ${good}`);
        console.log(`   🟡 Acceptable (100-120% of expected): ${acceptable}`);
        console.log(`   🔴 Poor (> 120% of expected): ${poor}`);
        console.log(`\n💡 OPTIMIZATION RECOMMENDATIONS:`);
        const slowTests = this.results.filter(r => !r.passed || r.duration > r.expectedMaxTime * 0.8);
        if (slowTests.length === 0) {
            console.log(`   ✅ All tests performing excellently! No optimizations needed.`);
        }
        else {
            slowTests.forEach(test => {
                console.log(`   ⚠️  ${test.name}: Consider further optimization`);
                if (test.name.includes('Search')) {
                    console.log(`      💡 Add more specific indexes or enable query result caching`);
                }
                else if (test.name.includes('Dashboard')) {
                    console.log(`      💡 Increase cache TTL or implement background cache refresh`);
                }
                else if (test.name.includes('Analytics')) {
                    console.log(`      💡 Consider materialized views for complex aggregations`);
                }
            });
        }
        if (passed === totalTests) {
            console.log(`\n🎉 CONGRATULATIONS! ALL PERFORMANCE TESTS PASSED!`);
            console.log(`🚀 Your optimization efforts have been successful!`);
            console.log(`📊 Average improvement: ${this.calculateAverageImprovement()}%`);
        }
        else {
            console.log(`\n⚠️  ${failed} test(s) need attention for optimal performance.`);
        }
    }
    calculateAverageImprovement() {
        const improvements = this.results
            .map(r => r.improvement)
            .filter(imp => imp)
            .map(imp => parseInt(imp.split('%')[0]));
        if (improvements.length === 0)
            return 0;
        return Math.round(improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length);
    }
    exportResults() {
        const report = {
            timestamp: new Date().toISOString(),
            totalTests: this.results.length,
            passed: this.results.filter(r => r.passed).length,
            failed: this.results.filter(r => !r.passed).length,
            averageImprovement: this.calculateAverageImprovement(),
            results: this.results,
            performanceAnalytics: this.performanceMonitor.getPerformanceAnalytics()
        };
        return JSON.stringify(report, null, 2);
    }
    async cleanup() {
        await prisma.$disconnect();
    }
}
exports.OptimizationTester = OptimizationTester;
if (require.main === module) {
    const tester = new OptimizationTester();
    tester.runAllTests()
        .then(() => {
        console.log('\n📄 Exporting detailed results...');
        tester.exportResults();
        console.log('📊 Results exported successfully!');
        return tester.cleanup();
    })
        .catch((error) => {
        console.error('❌ Testing failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=testOptimizations.js.map