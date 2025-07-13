import { PrismaClient } from '@prisma/client';
import PerformanceMonitor from '../middleware/performanceMonitor';

const prisma = new PrismaClient();

interface PerformanceTest {
  name: string;
  category: 'auth' | 'students' | 'reports' | 'audit' | 'admin';
  testFunction: () => Promise<number>;
  expectedThreshold: number; // ms
  criticalThreshold: number; // ms
}

interface PerformanceResults {
  testName: string;
  category: string;
  duration: number;
  status: 'excellent' | 'good' | 'slow' | 'critical';
  improvement?: number; // percentage
}

class PerformanceTestFramework {
  private baselines = new Map<string, number>();
  
  // Define performance tests for each critical area
  private tests: PerformanceTest[] = [
    // 1. LOGIN PROCESS TESTS
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
    
    // 2. STUDENT REGISTRATION TESTS
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
    
    // 3. REPORTS PERFORMANCE TESTS
    {
      name: 'Dashboard Stats Query',
      category: 'reports',
      testFunction: async () => {
        const start = performance.now();
        await prisma.$queryRaw`
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
    
    // 4. AUDIT LOG TESTS
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
    
    // 5. ADMIN MANAGEMENT TESTS
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

  /**
   * Run all performance tests and establish baseline
   */
  async runBaselineTests(): Promise<PerformanceResults[]> {
    console.log('🏁 Running Performance Baseline Tests...\n');
    
    const results: PerformanceResults[] = [];
    
    for (const test of this.tests) {
      try {
        console.log(`Testing: ${test.name}...`);
        
        // Run test 3 times and take average
        const runs: number[] = [];
        for (let i = 0; i < 3; i++) {
          const duration = await test.testFunction();
          runs.push(duration);
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between runs
        }
        
        const avgDuration = Math.round(runs.reduce((sum, run) => sum + run, 0) / runs.length);
        
        // Store baseline
        this.baselines.set(test.name, avgDuration);
        
        // Determine status
        let status: 'excellent' | 'good' | 'slow' | 'critical';
        if (avgDuration <= test.expectedThreshold) status = 'excellent';
        else if (avgDuration <= test.expectedThreshold * 1.5) status = 'good';
        else if (avgDuration <= test.criticalThreshold) status = 'slow';
        else status = 'critical';
        
        const result: PerformanceResults = {
          testName: test.name,
          category: test.category,
          duration: avgDuration,
          status
        };
        
        results.push(result);
        
        console.log(`  ✓ ${avgDuration}ms (${status.toUpperCase()})`);
        
      } catch (error) {
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

  /**
   * Run performance tests and compare with baseline
   */
  async runComparisonTests(): Promise<PerformanceResults[]> {
    console.log('📊 Running Performance Comparison Tests...\n');
    
    const results: PerformanceResults[] = [];
    
    for (const test of this.tests) {
      try {
        const baseline = this.baselines.get(test.name);
        if (!baseline) {
          console.log(`⚠️  No baseline for ${test.name}, skipping comparison`);
          continue;
        }
        
        console.log(`Testing: ${test.name}...`);
        
        // Run test 3 times and take average
        const runs: number[] = [];
        for (let i = 0; i < 3; i++) {
          const duration = await test.testFunction();
          runs.push(duration);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const avgDuration = Math.round(runs.reduce((sum, run) => sum + run, 0) / runs.length);
        
        // Calculate improvement
        const improvement = Math.round(((baseline - avgDuration) / baseline) * 100);
        
        // Determine status
        let status: 'excellent' | 'good' | 'slow' | 'critical';
        if (avgDuration <= test.expectedThreshold) status = 'excellent';
        else if (avgDuration <= test.expectedThreshold * 1.5) status = 'good';
        else if (avgDuration <= test.criticalThreshold) status = 'slow';
        else status = 'critical';
        
        const result: PerformanceResults = {
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
        
      } catch (error) {
        console.error(`  ✗ Failed: ${error}`);
      }
    }
    
    this.printComparisonReport(results);
    return results;
  }

  /**
   * Test specific database query performance
   */
  async testQuery(name: string, queryFn: () => Promise<any>): Promise<number> {
    const runs: number[] = [];
    
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

  /**
   * Get current system performance statistics
   */
  getSystemStats() {
    return PerformanceMonitor.getStats();
  }

  private printBaselineReport(results: PerformanceResults[]) {
    console.log('\n📋 BASELINE PERFORMANCE REPORT');
    console.log('================================');
    
    const byCategory = results.reduce((acc, result) => {
      if (!acc[result.category]) acc[result.category] = [];
      acc[result.category].push(result);
      return acc;
    }, {} as Record<string, PerformanceResults[]>);
    
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

  private printComparisonReport(results: PerformanceResults[]) {
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

export default PerformanceTestFramework; 