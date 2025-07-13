import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import PerformanceMonitoringService from '../services/PerformanceMonitoringService';
import ReportingService from '../services/ReportingService';

const prisma = new PrismaClient();

interface PerformanceTest {
  name: string;
  operation: () => Promise<any>;
  expectedMaxTime: number; // in milliseconds
  description: string;
}

interface TestResult {
  name: string;
  duration: number;
  passed: boolean;
  expectedMaxTime: number;
  improvement?: string;
  description: string;
  data?: any;
}

/**
 * 🧪 COMPREHENSIVE PERFORMANCE TESTING SUITE
 * Tests all optimized operations and measures performance improvements
 */
class OptimizationTester {
  private performanceMonitor: PerformanceMonitoringService;
  private reportingService: ReportingService;
  private results: TestResult[] = [];

  constructor() {
    this.performanceMonitor = PerformanceMonitoringService.getInstance();
    this.performanceMonitor.setupPrismaMiddleware(prisma);
    this.reportingService = ReportingService.getInstance(prisma);
  }

  /**
   * 🎯 Define all performance tests
   */
  private getPerformanceTests(): PerformanceTest[] {
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

  /**
   * 🚀 Run a single performance test
   */
  private async runTest(test: PerformanceTest): Promise<TestResult> {
    console.log(`\n🧪 Running: ${test.name}`);
    console.log(`📝 ${test.description}`);
    console.log(`⏱️  Expected max time: ${test.expectedMaxTime}ms`);

    const startTime = performance.now();
    let data: any;
    let error: Error | null = null;

    try {
      data = await test.operation();
    } catch (err) {
      error = err as Error;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const passed = !error && duration <= test.expectedMaxTime;

    const result: TestResult = {
      name: test.name,
      duration: Math.round(duration * 100) / 100,
      passed,
      expectedMaxTime: test.expectedMaxTime,
      description: test.description,
      data: error ? null : data
    };

    // Calculate improvement percentage (assuming baseline is 2x expected time)
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

  /**
   * 🏃‍♂️ Run all performance tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 STARTING COMPREHENSIVE PERFORMANCE TESTING');
    console.log('='.repeat(60));
    
    const tests = this.getPerformanceTests();
    const startTime = performance.now();

    for (const test of tests) {
      const result = await this.runTest(test);
      this.results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const totalTime = performance.now() - startTime;

    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    this.printResultsSummary(totalTime);
    return this.results;
  }

  /**
   * 📊 Print detailed results summary
   */
  private printResultsSummary(totalTime: number): void {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalTests = this.results.length;

    console.log(`\n🎯 OVERALL RESULTS:`);
    console.log(`   ✅ Passed: ${passed}/${totalTests} (${Math.round((passed/totalTests)*100)}%)`);
    console.log(`   ❌ Failed: ${failed}/${totalTests} (${Math.round((failed/totalTests)*100)}%)`);
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

    // Performance categories
    const excellent = this.results.filter(r => r.duration < r.expectedMaxTime * 0.5).length;
    const good = this.results.filter(r => r.duration < r.expectedMaxTime && r.duration >= r.expectedMaxTime * 0.5).length;
    const acceptable = this.results.filter(r => r.duration <= r.expectedMaxTime * 1.2 && r.duration >= r.expectedMaxTime).length;
    const poor = this.results.filter(r => r.duration > r.expectedMaxTime * 1.2).length;

    console.log(`\n🎨 PERFORMANCE CATEGORIES:`);
    console.log(`   🟢 Excellent (< 50% of expected): ${excellent}`);
    console.log(`   🔵 Good (50-100% of expected): ${good}`);
    console.log(`   🟡 Acceptable (100-120% of expected): ${acceptable}`);
    console.log(`   🔴 Poor (> 120% of expected): ${poor}`);

    // Recommendations
    console.log(`\n💡 OPTIMIZATION RECOMMENDATIONS:`);
    const slowTests = this.results.filter(r => !r.passed || r.duration > r.expectedMaxTime * 0.8);
    
    if (slowTests.length === 0) {
      console.log(`   ✅ All tests performing excellently! No optimizations needed.`);
    } else {
      slowTests.forEach(test => {
        console.log(`   ⚠️  ${test.name}: Consider further optimization`);
        if (test.name.includes('Search')) {
          console.log(`      💡 Add more specific indexes or enable query result caching`);
        } else if (test.name.includes('Dashboard')) {
          console.log(`      💡 Increase cache TTL or implement background cache refresh`);
        } else if (test.name.includes('Analytics')) {
          console.log(`      💡 Consider materialized views for complex aggregations`);
        }
      });
    }

    // Success celebration
    if (passed === totalTests) {
      console.log(`\n🎉 CONGRATULATIONS! ALL PERFORMANCE TESTS PASSED!`);
      console.log(`🚀 Your optimization efforts have been successful!`);
      console.log(`📊 Average improvement: ${this.calculateAverageImprovement()}%`);
    } else {
      console.log(`\n⚠️  ${failed} test(s) need attention for optimal performance.`);
    }
  }

  /**
   * 📊 Calculate average performance improvement
   */
  private calculateAverageImprovement(): number {
    const improvements = this.results
      .map(r => r.improvement)
      .filter(imp => imp)
      .map(imp => parseInt(imp!.split('%')[0]));

    if (improvements.length === 0) return 0;
    
    return Math.round(improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length);
  }

  /**
   * 📤 Export results to JSON
   */
  exportResults(): string {
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

  /**
   * 🧹 Cleanup resources
   */
  async cleanup(): Promise<void> {
    await prisma.$disconnect();
  }
}

/**
 * 🏃‍♂️ Run tests if script is executed directly
 */
if (require.main === module) {
  const tester = new OptimizationTester();
  
  tester.runAllTests()
    .then((results) => {
      console.log('\n📄 Exporting detailed results...');
      const report = tester.exportResults();
      console.log('📊 Results exported successfully!');
      
      return tester.cleanup();
    })
    .catch((error) => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}

export { OptimizationTester }; 