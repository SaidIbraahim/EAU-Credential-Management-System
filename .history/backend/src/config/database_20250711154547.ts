import { PrismaClient } from '@prisma/client';

/**
 * Optimized Database Configuration
 * Target: Solve underlying DB performance issues with connection pooling
 */

// Database connection pool configuration
const databaseConfig = {
  // Connection pool settings for maximum performance
  connectionString: process.env.DATABASE_URL,
  
  // Prisma connection pool configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  
  // Connection pool optimization
  connectionLimit: 20,        // Increase from default 5
  idleTimeout: 60000,        // 60 seconds
  acquireConnectionTimeout: 60000, // 60 seconds
  
  // Query optimization settings
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  
  // Performance monitoring
  errorFormat: 'pretty',
};

/**
 * Create optimized Prisma client with connection pooling
 */
function createOptimizedPrismaClient() {
  const prisma = new PrismaClient({
    log: databaseConfig.log as any,
    errorFormat: databaseConfig.errorFormat as any,
    
    // Connection pool configuration
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}?connection_limit=20&pool_timeout=20&connect_timeout=60`
      }
    }
  });

  // Add connection event listeners for monitoring
  prisma.$on('query', (event) => {
    if (process.env.NODE_ENV === 'development') {
      const duration = event.duration;
      if (duration > 1000) {
        console.warn(`⚠️  Slow query detected: ${duration}ms`);
        console.warn(`   Query: ${event.query.substring(0, 100)}...`);
      } else if (duration > 500) {
        console.log(`🐌 Query took: ${duration}ms`);
      }
    }
  });

  return prisma;
}

/**
 * Connection Pool Manager
 */
class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private prismaClient: PrismaClient;
  private connectionCount = 0;
  private queryStats = {
    totalQueries: 0,
    slowQueries: 0,
    averageResponseTime: 0,
    responseTimes: [] as number[]
  };

  private constructor() {
    this.prismaClient = createOptimizedPrismaClient();
    this.setupConnectionMonitoring();
  }

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  getPrismaClient(): PrismaClient {
    return this.prismaClient;
  }

  private setupConnectionMonitoring() {
    // Monitor query performance
    this.prismaClient.$on('query', (event) => {
      this.queryStats.totalQueries++;
      this.queryStats.responseTimes.push(event.duration);
      
      // Keep only last 100 response times for rolling average
      if (this.queryStats.responseTimes.length > 100) {
        this.queryStats.responseTimes.shift();
      }
      
      // Update average
      this.queryStats.averageResponseTime = 
        this.queryStats.responseTimes.reduce((sum, time) => sum + time, 0) / 
        this.queryStats.responseTimes.length;
      
      // Track slow queries
      if (event.duration > 1000) {
        this.queryStats.slowQueries++;
      }
    });

    // Periodic connection health check
    setInterval(async () => {
      try {
        await this.prismaClient.$queryRaw`SELECT 1`;
        console.log(`🔗 DB Health Check: OK (${this.queryStats.totalQueries} queries, avg: ${Math.round(this.queryStats.averageResponseTime)}ms)`);
      } catch (error) {
        console.error('❌ Database health check failed:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  async testConnection(): Promise<{ success: boolean; latency: number; error?: string }> {
    try {
      const start = performance.now();
      await this.prismaClient.$queryRaw`SELECT 1`;
      const latency = performance.now() - start;
      
      return { success: true, latency: Math.round(latency) };
    } catch (error: any) {
      return { success: false, latency: 0, error: error.message };
    }
  }

  getConnectionStats() {
    return {
      ...this.queryStats,
      connectionCount: this.connectionCount,
      slowQueryPercentage: this.queryStats.totalQueries > 0 
        ? Math.round((this.queryStats.slowQueries / this.queryStats.totalQueries) * 100)
        : 0
    };
  }

  async optimizeConnection(): Promise<void> {
    try {
      // Force connection pool refresh
      console.log('🔄 Optimizing database connection...');
      
      // Test connection latency
      const connectionTest = await this.testConnection();
      console.log(`🔗 Connection latency: ${connectionTest.latency}ms`);
      
      if (connectionTest.latency > 500) {
        console.warn('⚠️  High connection latency detected');
      }
      
      // Clear any stale connections
      await this.prismaClient.$disconnect();
      await this.prismaClient.$connect();
      
      console.log('✅ Database connection optimized');
    } catch (error) {
      console.error('❌ Connection optimization failed:', error);
    }
  }

  async gracefulShutdown(): Promise<void> {
    console.log('🔌 Gracefully shutting down database connection...');
    await this.prismaClient.$disconnect();
  }
}

// Export singleton instance
export const dbManager = DatabaseConnectionManager.getInstance();
export const prisma = dbManager.getPrismaClient();

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await dbManager.gracefulShutdown();
});

process.on('SIGINT', async () => {
  await dbManager.gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await dbManager.gracefulShutdown();
  process.exit(0);
});

export default dbManager; 