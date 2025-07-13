import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any;
  model?: string;
  operation?: string;
}

interface SlowQueryAlert {
  query: string;
  duration: number;
  threshold: number;
  recommendation: string;
  timestamp: Date;
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private queryMetrics: QueryMetrics[] = [];
  private slowQueries: SlowQueryAlert[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly MAX_METRICS_HISTORY = 1000;

  private constructor() {}

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * 🚀 Setup Prisma middleware for automatic query monitoring
   */
  setupPrismaMiddleware(prisma: PrismaClient): void {
    prisma.$use(async (params, next) => {
      const start = performance.now();
      
      try {
        const result = await next(params);
        const duration = performance.now() - start;
        
        // Track query metrics
        this.trackQuery({
          query: `${params.model}.${params.action}`,
          duration,
          timestamp: new Date(),
          params: this.sanitizeParams(params.args),
          model: params.model,
          operation: params.action
        });

        // Check for slow queries
        if (duration > this.SLOW_QUERY_THRESHOLD) {
          this.alertSlowQuery({
            query: `${params.model}.${params.action}`,
            duration,
            threshold: this.SLOW_QUERY_THRESHOLD,
            recommendation: this.getOptimizationRecommendation(params.model, params.action, duration),
            timestamp: new Date()
          });
        }

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        console.error(`❌ Query failed after ${duration.toFixed(2)}ms:`, {
          model: params.model,
          action: params.action,
          error: error.message
        });
        throw error;
      }
    });
  }

  /**
   * 📊 Track individual query performance
   */
  private trackQuery(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    
    // Keep only recent metrics to prevent memory issues
    if (this.queryMetrics.length > this.MAX_METRICS_HISTORY) {
      this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS_HISTORY);
    }

    // Log slow queries immediately for debugging
    if (metrics.duration > this.SLOW_QUERY_THRESHOLD) {
      console.warn(`🐌 Slow Query Detected: ${metrics.query} took ${metrics.duration.toFixed(2)}ms`);
    }
  }

  /**
   * 🚨 Alert on slow queries with optimization recommendations
   */
  private alertSlowQuery(alert: SlowQueryAlert): void {
    this.slowQueries.push(alert);
    
    console.warn(`🚨 SLOW QUERY ALERT:`, {
      query: alert.query,
      duration: `${alert.duration.toFixed(2)}ms`,
      threshold: `${alert.threshold}ms`,
      recommendation: alert.recommendation
    });
  }

  /**
   * 💡 Get optimization recommendations for slow queries
   */
  private getOptimizationRecommendation(model?: string, action?: string, duration?: number): string {
    if (!model || !action) return 'Consider adding appropriate indexes';

    const recommendations: Record<string, Record<string, string>> = {
      Student: {
        findMany: 'Add indexes on status, department_id, created_at. Use select to limit fields.',
        findFirst: 'Add index on registration_id or certificate_id for unique lookups.',
        findUnique: 'Ensure unique indexes exist on registration_id and certificate_id.',
        count: 'Add partial indexes on status field for faster counting.',
        create: 'Consider batch operations for multiple inserts.',
        update: 'Add WHERE clause indexes. Avoid updating large result sets.',
        delete: 'Add indexes on deletion criteria fields.'
      },
      Document: {
        findMany: 'Add compound index on (registration_id, document_type).',
        findFirst: 'Add index on registration_id for student document lookups.',
        create: 'Consider batch document uploads for better performance.',
        update: 'Index document_type and upload_date for filtering.',
        delete: 'Add index on registration_id for cascade deletions.'
      },
      AuditLog: {
        findMany: 'Add compound index on (user_id, timestamp DESC).',
        create: 'Consider async logging to avoid blocking main operations.',
        findFirst: 'Add index on action field for audit queries.'
      }
    };

    const modelRec = recommendations[model];
    if (modelRec && modelRec[action]) {
      return modelRec[action];
    }

    if (duration && duration > 5000) {
      return 'CRITICAL: Query taking >5s. Review query structure and add appropriate indexes immediately.';
    }

    return `Consider optimizing ${model}.${action} with appropriate indexes and query optimization.`;
  }

  /**
   * 🧹 Sanitize query parameters for logging
   */
  private sanitizeParams(params: any): any {
    if (!params) return {};
    
    // Remove sensitive data but keep structure for analysis
    const sanitized = JSON.parse(JSON.stringify(params));
    
    // Remove password-related fields
    if (sanitized.passwordHash) delete sanitized.passwordHash;
    if (sanitized.password) delete sanitized.password;
    
    return sanitized;
  }

  /**
   * 📈 Get performance analytics
   */
  getPerformanceAnalytics() {
    const recentMetrics = this.queryMetrics.slice(-100); // Last 100 queries
    
    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueryCount: 0,
        slowestQuery: null,
        modelBreakdown: {},
        recommendations: []
      };
    }

    const totalQueries = recentMetrics.length;
    const averageQueryTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;
    const slowQueryCount = recentMetrics.filter(m => m.duration > this.SLOW_QUERY_THRESHOLD).length;
    
    // Fix TypeScript error by handling the initial value properly
    const slowestQuery = recentMetrics.length > 0 
      ? recentMetrics.reduce((slowest, current) => 
          current.duration > (slowest?.duration || 0) ? current : slowest)
      : null;

    // Model performance breakdown
    const modelBreakdown = recentMetrics.reduce((acc, metric) => {
      if (!metric.model) return acc;
      if (!acc[metric.model]) {
        acc[metric.model] = { count: 0, totalTime: 0, avgTime: 0 };
      }
      acc[metric.model].count++;
      acc[metric.model].totalTime += metric.duration;
      acc[metric.model].avgTime = acc[metric.model].totalTime / acc[metric.model].count;
      return acc;
    }, {} as Record<string, { count: number; totalTime: number; avgTime: number }>);

    // Generate recommendations
    const recommendations = this.generatePerformanceRecommendations(modelBreakdown, averageQueryTime);

    return {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      slowQueryCount,
      slowQueryPercentage: Math.round((slowQueryCount / totalQueries) * 100),
      slowestQuery: slowestQuery ? {
        query: slowestQuery.query,
        duration: Math.round(slowestQuery.duration * 100) / 100,
        timestamp: slowestQuery.timestamp
      } : null,
      modelBreakdown,
      recommendations,
      recentSlowQueries: this.slowQueries.slice(-5) // Last 5 slow queries
    };
  }

  /**
   * 💡 Generate performance improvement recommendations
   */
  private generatePerformanceRecommendations(
    modelBreakdown: Record<string, { count: number; totalTime: number; avgTime: number }>,
    averageQueryTime: number
  ): string[] {
    const recommendations: string[] = [];

    // Overall performance recommendations
    if (averageQueryTime > 500) {
      recommendations.push('🚨 CRITICAL: Average query time >500ms. Immediate optimization needed.');
    } else if (averageQueryTime > 200) {
      recommendations.push('⚠️ WARNING: Average query time >200ms. Consider optimization.');
    } else if (averageQueryTime < 50) {
      recommendations.push('✅ EXCELLENT: Average query time <50ms. Performance is optimal.');
    }

    // Model-specific recommendations
    Object.entries(modelBreakdown).forEach(([model, stats]) => {
      if (stats.avgTime > 1000) {
        recommendations.push(`🐌 ${model} queries averaging ${stats.avgTime.toFixed(0)}ms. Add indexes immediately.`);
      } else if (stats.avgTime > 500) {
        recommendations.push(`⚠️ ${model} queries averaging ${stats.avgTime.toFixed(0)}ms. Consider optimization.`);
      }

      // High frequency recommendations
      if (stats.count > 20) {
        recommendations.push(`📊 ${model} has ${stats.count} queries. Consider caching frequently accessed data.`);
      }
    });

    // General optimization tips
    if (recommendations.length === 0) {
      recommendations.push('✅ Performance looks good! Consider implementing query result caching for even better performance.');
    }

    return recommendations;
  }

  /**
   * 🧪 Index usage analysis simulation
   */
  async analyzeIndexUsage(prisma: PrismaClient): Promise<any> {
    try {
      // Query PostgreSQL index usage statistics
      const indexStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC;
      `;

      return {
        indexStats,
        recommendations: this.generateIndexRecommendations(indexStats as any[])
      };
    } catch (error) {
      console.warn('Could not analyze index usage:', error.message);
      return {
        indexStats: [],
        recommendations: ['Enable index usage tracking in PostgreSQL for detailed analysis.']
      };
    }
  }

  /**
   * 📊 Generate index optimization recommendations
   */
  private generateIndexRecommendations(indexStats: any[]): string[] {
    const recommendations: string[] = [];

    indexStats.forEach(stat => {
      if (stat.index_scans === 0) {
        recommendations.push(`🗑️ Index '${stat.indexname}' is unused. Consider dropping it.`);
      } else if (stat.index_scans < 10) {
        recommendations.push(`❓ Index '${stat.indexname}' has low usage (${stat.index_scans} scans).`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('✅ All indexes appear to be utilized effectively.');
    }

    return recommendations;
  }

  /**
   * 🧹 Clear metrics (for testing/reset)
   */
  clearMetrics(): void {
    this.queryMetrics = [];
    this.slowQueries = [];
  }

  /**
   * 📝 Export metrics for external analysis
   */
  exportMetrics() {
    return {
      queryMetrics: this.queryMetrics,
      slowQueries: this.slowQueries,
      analytics: this.getPerformanceAnalytics()
    };
  }
}

export default PerformanceMonitoringService; 