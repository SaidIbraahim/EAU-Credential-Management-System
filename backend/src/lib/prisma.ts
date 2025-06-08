import { PrismaClient } from '@prisma/client';

// Optimized Prisma client with connection pooling and performance monitoring
export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' }
  ],
  // Connection pooling optimization
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=20'
    }
  }
});

// Performance monitoring for slow queries
prisma.$on('query', (e) => {
  if (e.duration > 1000) { // Log queries taking more than 1 second
    console.log(`🐌 Slow Query (${e.duration}ms): ${e.query.substring(0, 100)}...`);
  }
});

// Optimize Prisma middleware for better performance
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  const duration = after - before;
  if (duration > 500) {
    console.log(`⚠️ Slow ${params.model}.${params.action}: ${duration}ms`);
  }
  
  return result;
}); 