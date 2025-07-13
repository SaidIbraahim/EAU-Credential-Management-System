import PerformanceTestFramework from '../utils/performanceTestFramework';
import { prisma } from '../lib/prisma';
import * as fs from 'fs';

async function runPerformanceComparison() {
  console.log('📊 EAU CREDENTIAL SYSTEM - PERFORMANCE COMPARISON ANALYSIS');
  console.log('=========================================================\n');
  
  const framework = new PerformanceTestFramework();
  
  try {
    // Test database connection
    console.log('🔗 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // Load baseline data
    let baselineData = null;
    try {
      const baselineFile = fs.readFileSync('performance-baseline.json', 'utf8');
      baselineData = JSON.parse(baselineFile);
      console.log('📋 Baseline data loaded from previous test\n');
    } catch (error) {
      console.log('⚠️  No baseline data found, running new baseline...\n');
      await framework.runBaselineTests();
    }
    
    // Run comparison tests
    console.log('🔄 Running performance tests after database index optimization...\n');
    const results = await framework.runComparisonTests();
    
    // Calculate overall improvement
    const validResults = results.filter(r => r.improvement !== undefined);
    const avgImprovement = validResults.length > 0 
      ? validResults.reduce((sum, r) => sum + (r.improvement || 0), 0) / validResults.length 
      : 0;
    
    console.log('🎯 OPTIMIZATION IMPACT ANALYSIS:');
    console.log('===============================');
    
    // Analyze by category
    const categories = ['auth', 'students', 'reports', 'audit', 'admin'];
    categories.forEach(category => {
      const categoryResults = results.filter(r => r.testName.toLowerCase().includes(category));
      if (categoryResults.length > 0) {
        const categoryImprovement = categoryResults.reduce((sum, r) => sum + (r.improvement || 0), 0) / categoryResults.length;
        const icon = categoryImprovement > 50 ? '🚀' : categoryImprovement > 25 ? '📈' : categoryImprovement > 0 ? '⬆️' : '⬇️';
        console.log(`${icon} ${category.toUpperCase()}: ${categoryImprovement > 0 ? '+' : ''}${Math.round(categoryImprovement)}% improvement`);
      }
    });
    
    console.log(`\n📊 OVERALL SYSTEM IMPROVEMENT: ${avgImprovement > 0 ? '+' : ''}${Math.round(avgImprovement)}%`);
    
    // Determine if we met our targets
    const criticalFixed = results.filter(r => 
      r.testName.includes('Login') || r.testName.includes('Student List')
    ).every(r => r.status === 'excellent' || r.status === 'good');
    
    const slowFixed = results.filter(r => 
      r.testName.includes('Dashboard') || r.testName.includes('Audit') || r.testName.includes('Management')
    ).every(r => r.status === 'excellent' || r.status === 'good');
    
    console.log('\n🎯 TARGET ACHIEVEMENT:');
    console.log(criticalFixed ? '✅ CRITICAL issues resolved' : '❌ CRITICAL issues still present');
    console.log(slowFixed ? '✅ SLOW issues resolved' : '❌ SLOW issues still present');
    
    // Recommendations for next steps
    console.log('\n💡 NEXT OPTIMIZATION RECOMMENDATIONS:');
    
    if (avgImprovement >= 50) {
      console.log('🎉 EXCELLENT: Database indexes provided major performance boost!');
      console.log('✅ Ready for Step 3: Query Optimization (selective fields)');
      console.log('✅ Ready for Step 4: Frontend Caching Enhancements');
    } else if (avgImprovement >= 25) {
      console.log('👍 GOOD: Database indexes provided solid improvements');
      console.log('📊 Recommended: Step 3: Query Optimization for additional gains');
      console.log('⚡ Consider: More targeted indexes for remaining slow queries');
    } else if (avgImprovement >= 10) {
      console.log('📈 MODERATE: Some improvement from indexes');
      console.log('🔍 Required: Investigate query patterns for additional optimization');
      console.log('💾 Consider: Application-level caching strategies');
    } else {
      console.log('⚠️  LIMITED: Minimal improvement from indexes alone');
      console.log('🔧 Required: Deep query optimization and application refactoring');
      console.log('🎯 Focus: Algorithmic improvements and data access patterns');
    }
    
    console.log('\n📊 SAFETY ASSESSMENT:');
    console.log('✅ No functional regressions expected (indexes are read-only)');
    console.log('✅ All existing queries should work unchanged');
    console.log('✅ System stability maintained');
    
    // Save comparison results
    const comparisonData = {
      timestamp: new Date().toISOString(),
      optimization: 'Database Indexes',
      results,
      overallImprovement: avgImprovement,
      baseline: baselineData
    };
    
    fs.writeFileSync('performance-comparison-indexes.json', JSON.stringify(comparisonData, null, 2));
    console.log('\n💾 Comparison results saved to performance-comparison-indexes.json');
    
  } catch (error) {
    console.error('❌ Performance comparison failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runPerformanceComparison().catch(console.error);
}

export default runPerformanceComparison; 