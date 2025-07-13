"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const perf_hooks_1 = require("perf_hooks");
class PerformanceMonitoringService {
    constructor() {
        this.queryMetrics = [];
        this.slowQueries = [];
        this.SLOW_QUERY_THRESHOLD = 1000;
        this.MAX_METRICS_HISTORY = 1000;
    }
    static getInstance() {
        if (!PerformanceMonitoringService.instance) {
            PerformanceMonitoringService.instance = new PerformanceMonitoringService();
        }
        return PerformanceMonitoringService.instance;
    }
    setupPrismaMiddleware(prisma) {
        prisma.$use(async (params, next) => {
            const start = perf_hooks_1.performance.now();
            try {
                const result = await next(params);
                const duration = perf_hooks_1.performance.now() - start;
                this.trackQuery({
                    query: `${params.model}.${params.action}`,
                    duration,
                    timestamp: new Date(),
                    params: this.sanitizeParams(params.args),
                    model: params.model,
                    operation: params.action
                });
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
            }
            catch (error) {
                const duration = perf_hooks_1.performance.now() - start;
                console.error(`❌ Query failed after ${duration.toFixed(2)}ms:`, {
                    model: params.model,
                    action: params.action,
                    error: error.message
                });
                throw error;
            }
        });
    }
    trackQuery(metrics) {
        this.queryMetrics.push(metrics);
        if (this.queryMetrics.length > this.MAX_METRICS_HISTORY) {
            this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS_HISTORY);
        }
        if (metrics.duration > this.SLOW_QUERY_THRESHOLD) {
            console.warn(`🐌 Slow Query Detected: ${metrics.query} took ${metrics.duration.toFixed(2)}ms`);
        }
    }
    alertSlowQuery(alert) {
        this.slowQueries.push(alert);
        console.warn(`🚨 SLOW QUERY ALERT:`, {
            query: alert.query,
            duration: `${alert.duration.toFixed(2)}ms`,
            threshold: `${alert.threshold}ms`,
            recommendation: alert.recommendation
        });
    }
    getOptimizationRecommendation(model, action, duration) {
        if (!model || !action)
            return 'Consider adding appropriate indexes';
        const recommendations = {
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
    sanitizeParams(params) {
        if (!params)
            return {};
        const sanitized = JSON.parse(JSON.stringify(params));
        if (sanitized.passwordHash)
            delete sanitized.passwordHash;
        if (sanitized.password)
            delete sanitized.password;
        return sanitized;
    }
    getPerformanceAnalytics() {
        const recentMetrics = this.queryMetrics.slice(-100);
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
        const slowestQuery = recentMetrics.length > 0
            ? recentMetrics.reduce((slowest, current) => !slowest || current.duration > slowest.duration ? current : slowest, undefined)
            : null;
        const modelBreakdown = recentMetrics.reduce((acc, metric) => {
            if (!metric.model)
                return acc;
            if (!acc[metric.model]) {
                acc[metric.model] = { count: 0, totalTime: 0, avgTime: 0 };
            }
            acc[metric.model].count++;
            acc[metric.model].totalTime += metric.duration;
            acc[metric.model].avgTime = acc[metric.model].totalTime / acc[metric.model].count;
            return acc;
        }, {});
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
            recentSlowQueries: this.slowQueries.slice(-5)
        };
    }
    generatePerformanceRecommendations(modelBreakdown, averageQueryTime) {
        const recommendations = [];
        if (averageQueryTime > 500) {
            recommendations.push('🚨 CRITICAL: Average query time >500ms. Immediate optimization needed.');
        }
        else if (averageQueryTime > 200) {
            recommendations.push('⚠️ WARNING: Average query time >200ms. Consider optimization.');
        }
        else if (averageQueryTime < 50) {
            recommendations.push('✅ EXCELLENT: Average query time <50ms. Performance is optimal.');
        }
        Object.entries(modelBreakdown).forEach(([model, stats]) => {
            if (stats.avgTime > 1000) {
                recommendations.push(`🐌 ${model} queries averaging ${stats.avgTime.toFixed(0)}ms. Add indexes immediately.`);
            }
            else if (stats.avgTime > 500) {
                recommendations.push(`⚠️ ${model} queries averaging ${stats.avgTime.toFixed(0)}ms. Consider optimization.`);
            }
            if (stats.count > 20) {
                recommendations.push(`📊 ${model} has ${stats.count} queries. Consider caching frequently accessed data.`);
            }
        });
        if (recommendations.length === 0) {
            recommendations.push('✅ Performance looks good! Consider implementing query result caching for even better performance.');
        }
        return recommendations;
    }
    async analyzeIndexUsage(prisma) {
        try {
            const indexStats = await prisma.$queryRaw `
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
                recommendations: this.generateIndexRecommendations(indexStats)
            };
        }
        catch (error) {
            console.warn('Could not analyze index usage:', error.message);
            return {
                indexStats: [],
                recommendations: ['Enable index usage tracking in PostgreSQL for detailed analysis.']
            };
        }
    }
    generateIndexRecommendations(indexStats) {
        const recommendations = [];
        indexStats.forEach(stat => {
            if (stat.index_scans === 0) {
                recommendations.push(`🗑️ Index '${stat.indexname}' is unused. Consider dropping it.`);
            }
            else if (stat.index_scans < 10) {
                recommendations.push(`❓ Index '${stat.indexname}' has low usage (${stat.index_scans} scans).`);
            }
        });
        if (recommendations.length === 0) {
            recommendations.push('✅ All indexes appear to be utilized effectively.');
        }
        return recommendations;
    }
    clearMetrics() {
        this.queryMetrics = [];
        this.slowQueries = [];
    }
    exportMetrics() {
        return {
            queryMetrics: this.queryMetrics,
            slowQueries: this.slowQueries,
            analytics: this.getPerformanceAnalytics()
        };
    }
}
exports.default = PerformanceMonitoringService;
//# sourceMappingURL=PerformanceMonitoringService.js.map