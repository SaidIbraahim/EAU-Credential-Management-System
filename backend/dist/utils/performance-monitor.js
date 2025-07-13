"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPerformanceMiddleware = exports.performanceMonitor = void 0;
class PerformanceMonitor {
    constructor() {
        this.queryMetrics = [];
        this.slowQueryThreshold = 1000;
    }
    logQuery(query, duration, rowsAffected) {
        const metric = {
            query: this.sanitizeQuery(query),
            duration,
            timestamp: new Date(),
            rowsAffected
        };
        this.queryMetrics.push(metric);
        if (this.queryMetrics.length > 1000) {
            this.queryMetrics = this.queryMetrics.slice(-1000);
        }
        if (duration > this.slowQueryThreshold) {
            console.warn(`🐌 Slow Query Detected (${duration}ms):`, query.substring(0, 100) + '...');
        }
    }
    getSlowQueries(limit = 10) {
        return this.queryMetrics
            .filter(m => m.duration > this.slowQueryThreshold)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }
    getAverageQueryTime() {
        if (this.queryMetrics.length === 0)
            return 0;
        const total = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0);
        return total / this.queryMetrics.length;
    }
    getQueryStats() {
        const totalQueries = this.queryMetrics.length;
        const slowQueries = this.queryMetrics.filter(m => m.duration > this.slowQueryThreshold).length;
        const avgTime = this.getAverageQueryTime();
        return {
            totalQueries,
            slowQueries,
            slowQueryPercentage: totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0,
            averageQueryTime: avgTime,
            slowQueryThreshold: this.slowQueryThreshold
        };
    }
    sanitizeQuery(query) {
        return query
            .replace(/password\s*=\s*['"][^'"]*['"]/gi, 'password=***')
            .replace(/email\s*=\s*['"][^'"]*['"]/gi, 'email=***');
    }
    async analyzeIndexUsage(prisma) {
        try {
            const indexUsage = await prisma.$queryRaw `
        SELECT 
          schemaname,
          tablename,
          attname as column_name,
          n_distinct,
          correlation,
          most_common_vals
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname;
      `;
            const unusedIndexes = await prisma.$queryRaw `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE idx_scan = 0
        ORDER BY tablename;
      `;
            return {
                indexUsage,
                unusedIndexes,
                recommendations: this.generateIndexRecommendations(unusedIndexes)
            };
        }
        catch (error) {
            console.error('Error analyzing index usage:', error);
            return null;
        }
    }
    generateIndexRecommendations(unusedIndexes) {
        const recommendations = [];
        for (const index of unusedIndexes) {
            if (index.indexname.includes('_pkey') || index.indexname.includes('_unique')) {
                continue;
            }
            recommendations.push({
                type: 'CONSIDER_DROPPING',
                index: index.indexname,
                table: index.tablename,
                reason: 'Index has never been used for scans',
                impact: 'Low - will reduce storage and improve insert performance'
            });
        }
        return recommendations;
    }
}
exports.performanceMonitor = new PerformanceMonitor();
const createPerformanceMiddleware = () => {
    return async (params, next) => {
        const start = Date.now();
        const result = await next(params);
        const duration = Date.now() - start;
        exports.performanceMonitor.logQuery(`${params.model}.${params.action}`, duration, Array.isArray(result) ? result.length : result ? 1 : 0);
        return result;
    };
};
exports.createPerformanceMiddleware = createPerformanceMiddleware;
//# sourceMappingURL=performance-monitor.js.map