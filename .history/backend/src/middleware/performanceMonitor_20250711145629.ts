import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static slowQueryThreshold = 500; // 500ms
  private static maxMetricsStorage = 1000; // Keep last 1000 requests

  /**
   * Middleware to monitor API performance
   */
  static middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const endpoint = req.path;
      const method = req.method;
      
      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = function(...args: any[]): any {
        const duration = Date.now() - startTime;
        
        // Log performance
        PerformanceMonitor.logRequest({
          endpoint,
          method,
          duration,
          timestamp: new Date(),
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });

        // Call original end method
        originalEnd.apply(this, args);
      };

      next();
    };
  }

  /**
   * Log request performance
   */
  private static logRequest(metrics: PerformanceMetrics) {
    // Add to metrics array
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsStorage) {
      this.metrics = this.metrics.slice(-this.maxMetricsStorage);
    }

    // Log based on performance
    if (metrics.duration > this.slowQueryThreshold) {
      console.log(`🐌 Slow API endpoint: ${metrics.method} ${metrics.endpoint} took ${metrics.duration.toFixed(2)}ms`);
    } else if (metrics.duration < 100) {
      console.log(`⚡ Fast API endpoint: ${metrics.method} ${metrics.endpoint} took ${metrics.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance statistics
   */
  static getStats() {
    const now = Date.now();
    const last5Minutes = this.metrics.filter(m => now - m.timestamp.getTime() < 5 * 60 * 1000);
    const last1Hour = this.metrics.filter(m => now - m.timestamp.getTime() < 60 * 60 * 1000);

    const avgDuration5Min = last5Minutes.length > 0 
      ? last5Minutes.reduce((sum, m) => sum + m.duration, 0) / last5Minutes.length
      : 0;

    const avgDuration1Hour = last1Hour.length > 0 
      ? last1Hour.reduce((sum, m) => sum + m.duration, 0) / last1Hour.length
      : 0;

    const slowQueries5Min = last5Minutes.filter(m => m.duration > this.slowQueryThreshold);
    const slowQueries1Hour = last1Hour.filter(m => m.duration > this.slowQueryThreshold);

    // Find slowest endpoints
    const endpointStats = new Map<string, { count: number; totalDuration: number; maxDuration: number }>();
    
    last1Hour.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const current = endpointStats.get(key) || { count: 0, totalDuration: 0, maxDuration: 0 };
      
      current.count++;
      current.totalDuration += metric.duration;
      current.maxDuration = Math.max(current.maxDuration, metric.duration);
      
      endpointStats.set(key, current);
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: stats.totalDuration / stats.count,
        maxDuration: stats.maxDuration,
        requestCount: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return {
      summary: {
        totalRequests: this.metrics.length,
        requests5Min: last5Minutes.length,
        requests1Hour: last1Hour.length,
        avgDuration5Min: Math.round(avgDuration5Min),
        avgDuration1Hour: Math.round(avgDuration1Hour),
        slowQueries5Min: slowQueries5Min.length,
        slowQueries1Hour: slowQueries1Hour.length,
        slowQueryThreshold: this.slowQueryThreshold
      },
      slowestEndpoints,
      recentSlowQueries: slowQueries5Min.slice(-10).map(m => ({
        endpoint: `${m.method} ${m.endpoint}`,
        duration: m.duration,
        timestamp: m.timestamp
      }))
    };
  }

  /**
   * Set slow query threshold
   */
  static setSlowQueryThreshold(ms: number) {
    this.slowQueryThreshold = ms;
    console.log(`🎯 Slow query threshold set to ${ms}ms`);
  }

  /**
   * Get recent slow queries
   */
  static getSlowQueries(limit = 20) {
    return this.metrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .slice(-limit)
      .map(m => ({
        endpoint: `${m.method} ${m.endpoint}`,
        duration: m.duration,
        timestamp: m.timestamp,
        userAgent: m.userAgent,
        ip: m.ip
      }));
  }

  /**
   * Clear metrics history
   */
  static clearMetrics() {
    this.metrics = [];
    console.log('🗑️ Performance metrics cleared');
  }
}

export default PerformanceMonitor; 