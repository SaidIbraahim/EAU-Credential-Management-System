import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Define proper types for database events
interface QueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

// Enhanced Prisma client with performance monitoring
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private prismaClient: PrismaClient;
  private queryStats = {
    totalQueries: 0,
    slowQueries: 0,
    responseTimes: [] as number[],
    lastReset: new Date()
  };

  private constructor() {
    this.prismaClient = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    this.setupEventHandlers();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private setupEventHandlers(): void {
    // Enhanced query monitoring with proper typing
    try {
      (this.prismaClient as any).$on('query', (event: QueryEvent) => {
        this.queryStats.totalQueries++;
        
        if (event.duration && typeof event.duration === 'number') {
          this.queryStats.responseTimes.push(event.duration);
          
          // Log slow queries with context
          if (event.duration > 1000) {
            this.queryStats.slowQueries++;
            console.warn(`⚠️ Slow ${event.target || 'Unknown'}: ${event.duration}ms`);
            
            if (event.query && typeof event.query === 'string') {
              console.warn(`   Query: ${event.query.substring(0, 100)}...`);
            }
          }
        }

        // Keep only recent response times (last 100 queries)
        if (this.queryStats.responseTimes.length > 100) {
          this.queryStats.responseTimes = this.queryStats.responseTimes.slice(-100);
        }
      });
    } catch (error) {
      logger.warn('Query monitoring setup failed:', error);
    }
  }

  // Performance monitoring methods
  public getQueryStats() {
    const responseTimes = this.queryStats.responseTimes;
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return {
      totalQueries: this.queryStats.totalQueries,
      slowQueries: this.queryStats.slowQueries,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      slowQueryPercentage: this.queryStats.totalQueries > 0 
        ? Math.round((this.queryStats.slowQueries / this.queryStats.totalQueries) * 100 * 100) / 100
        : 0,
      lastReset: this.queryStats.lastReset
    };
  }

  public resetStats(): void {
    this.queryStats = {
      totalQueries: 0,
      slowQueries: 0,
      responseTimes: [],
      lastReset: new Date()
    };
    logger.info('📊 Database statistics reset');
  }

  public getClient(): PrismaClient {
    return this.prismaClient;
  }

  public async connect(): Promise<void> {
    try {
      await this.prismaClient.$connect();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prismaClient.$disconnect();
      logger.info('🔌 Database disconnected');
    } catch (error) {
      logger.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prismaClient.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('❌ Database health check failed:', error);
      return false;
    }
  }
}

// Create global instance
const dbConnection = DatabaseConnection.getInstance();

// Export the Prisma client instance for use throughout the app
export const prisma = dbConnection.getClient();

// Export database utilities
export const dbStats = () => dbConnection.getQueryStats();
export const resetDbStats = () => dbConnection.resetStats();
export const connectDatabase = () => dbConnection.connect();
export const disconnectDatabase = () => dbConnection.disconnect();
export const databaseHealthCheck = () => dbConnection.healthCheck(); 