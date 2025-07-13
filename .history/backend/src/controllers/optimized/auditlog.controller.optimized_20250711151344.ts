import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export class OptimizedAuditLogController {
  /**
   * OPTIMIZED: Get audit logs with selective field loading
   * Target: 527ms → 100-200ms (70% improvement)
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Optimized Audit Log Query');
      
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = req.query.search as string;
      const action = req.query.action as string;
      const resourceType = req.query.resourceType as string;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const skip = (page - 1) * limit;

      // Build optimized where clause
      const where: any = {};

      // OPTIMIZATION 1: Use indexed fields for search
      if (search) {
        where.OR = [
          { action: { contains: search, mode: 'insensitive' } },
          { details: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Use indexed filters
      if (action) {
        where.action = { contains: action, mode: 'insensitive' };
      }

      if (resourceType) {
        where.resourceType = resourceType;
      }

      if (userId) {
        where.userId = userId;
      }

      // Date range filtering with indexed timestamp
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
          where.timestamp.lte = new Date(endDate);
        }
      }

      // OPTIMIZATION 2: Parallel queries with selective fields
      const [total, auditLogs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          select: {
            id: true,
            action: true,
            resourceType: true,
            resourceId: true,
            details: true,
            timestamp: true,
            ipAddress: true,
            // SELECTIVE user fields only
            user: {
              select: {
                id: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      console.timeEnd('⚡ Optimized Audit Log Query');
      console.log(`⚡ Fetched ${auditLogs.length} audit logs with optimized query`);

      return res.json({
        success: true,
        data: {
          auditLogs,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * OPTIMIZED: Get audit log statistics with raw SQL
   */
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Optimized Audit Stats Query');

      // Use raw SQL for complex statistics (faster than Prisma aggregations)
      const [statsResult, topActionsResult, topUsersResult] = await Promise.all([
        // Basic stats with raw SQL
        prisma.$queryRaw`
          SELECT 
            COUNT(*)::int as total,
            COUNT(CASE WHEN timestamp >= CURRENT_DATE THEN 1 END)::int as today,
            COUNT(CASE WHEN timestamp >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::int as this_week,
            COUNT(CASE WHEN timestamp >= CURRENT_DATE - INTERVAL '1 month' THEN 1 END)::int as this_month
          FROM audit_logs
        `,
        
        // Top actions
        prisma.$queryRaw`
          SELECT action, COUNT(*)::int as count
          FROM audit_logs
          WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY action
          ORDER BY count DESC
          LIMIT 10
        `,
        
        // Top users (last 7 days)
        prisma.$queryRaw`
          SELECT 
            u.id,
            u.email,
            u.role,
            COUNT(al.id)::int as count
          FROM audit_logs al
          JOIN users u ON al.user_id = u.id
          WHERE al.timestamp >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY u.id, u.email, u.role
          ORDER BY count DESC
          LIMIT 10
        `
      ]);

      const stats = (statsResult as any[])[0];
      const topActions = topActionsResult as any[];
      const topUsers = topUsersResult as any[];

      // Get recent activities with selective fields
      const recentActivities = await prisma.auditLog.findMany({
        take: 10,
        select: {
          id: true,
          action: true,
          resourceType: true,
          timestamp: true,
          user: {
            select: { email: true, role: true }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      console.timeEnd('⚡ Optimized Audit Stats Query');

      return res.json({
        success: true,
        data: {
          totals: {
            total: Number(stats.total),
            today: Number(stats.today),
            thisWeek: Number(stats.this_week),
            thisMonth: Number(stats.this_month)
          },
          topActions: topActions.map(item => ({
            action: item.action,
            count: Number(item.count)
          })),
          topUsers: topUsers.map(item => ({
            user: {
              id: Number(item.id),
              email: item.email,
              role: item.role
            },
            count: Number(item.count)
          })),
          recentActivities
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * OPTIMIZED: Get recent audit logs for dashboard
   */
  async getRecent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Optimized Recent Audit Query');
      
      const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

      const recentLogs = await prisma.auditLog.findMany({
        take: limit,
        select: {
          id: true,
          action: true,
          resourceType: true,
          timestamp: true,
          details: true,
          user: {
            select: { email: true, role: true }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      console.timeEnd('⚡ Optimized Recent Audit Query');

      return res.json({
        success: true,
        data: recentLogs
      });
    } catch (error) {
      next(error);
    }
  }
}

export default OptimizedAuditLogController; 