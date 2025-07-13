import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { AuthUser } from '../middleware/auth.middleware';

export class AuditLogController {
  /**
   * Get all audit logs with pagination, filtering, and search
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = req.query.search as string;
      const action = req.query.action as string;
      const resourceType = req.query.resourceType as string;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = {};

      // Search functionality
      if (search) {
        where.OR = [
          { action: { contains: search, mode: 'insensitive' } },
          { details: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ];
      }

      // Filter by action
      if (action) {
        where.action = { contains: action, mode: 'insensitive' };
      }

      // Filter by resource type
      if (resourceType) {
        where.resourceType = resourceType;
      }

      // Filter by user
      if (userId) {
        where.userId = userId;
      }

      // Date range filtering
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
          where.timestamp.lte = new Date(endDate);
        }
      }

      // Get total count and data in parallel
      const [total, auditLogs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          include: {
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
   * Get audit log by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new AppError('Invalid audit log ID', 400);
      }

      const auditLog = await prisma.auditLog.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!auditLog) {
        throw new AppError('Audit log not found', 404);
      }

      return res.json({
        success: true,
        data: auditLog
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ULTRA-OPTIMIZED: Create audit log entry (PERFORMANCE CRITICAL)
   * Target: 1971ms → <200ms (90% improvement)
   * 
   * Fix: Remove expensive user join - not needed for creation
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = (req as any).user as AuthUser;
      const { action, resourceType, resourceId, details } = req.body;

      if (!action) {
        throw new AppError('Action is required', 400);
      }

      console.time('⚡ Ultra-Fast Audit Log Creation');

      // Extract IP address and user agent from request
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // OPTIMIZATION: Create audit log WITHOUT expensive user join
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: user.id,
          action,
          resourceType,
          resourceId: resourceId ? parseInt(resourceId) : null,
          details,
          ipAddress,
          userAgent
        },
        select: {
          id: true,
          userId: true,
          action: true,
          resourceType: true,
          resourceId: true,
          details: true,
          timestamp: true
        }
      });

      console.timeEnd('⚡ Ultra-Fast Audit Log Creation');
      console.log(`⚡ Created audit log: ${action} (ULTRA-FAST)`);

      return res.status(201).json({
        success: true,
        data: {
          ...auditLog,
          // Add user info from request context (no DB query needed)
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('❌ Audit log creation error:', error);
      next(error);
    }
  }

  /**
   * Get audit log statistics
   */
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalLogs,
        todayLogs,
        weekLogs,
        monthLogs,
        topActions,
        topUsers,
        recentActivities
      ] = await Promise.all([
        // Total audit logs
        prisma.auditLog.count(),

        // Today's logs
        prisma.auditLog.count({
          where: { timestamp: { gte: today } }
        }),

        // This week's logs
        prisma.auditLog.count({
          where: { timestamp: { gte: thisWeek } }
        }),

        // This month's logs
        prisma.auditLog.count({
          where: { timestamp: { gte: thisMonth } }
        }),

        // Top actions
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: { action: true },
          orderBy: { _count: { action: 'desc' } },
          take: 10
        }),

        // Top users by activity
        prisma.auditLog.groupBy({
          by: ['userId'],
          _count: { userId: true },
          orderBy: { _count: { userId: 'desc' } },
          take: 10
        }),

        // Recent activities
        prisma.auditLog.findMany({
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 20
        })
      ]);

      // Get user details for top users
      const userIds = topUsers.map(u => u.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, role: true }
      });

      const topUsersWithDetails = topUsers.map(userStat => {
        const user = users.find(u => u.id === userStat.userId);
        return {
          user,
          count: userStat._count.userId
        };
      });

      return res.json({
        success: true,
        data: {
          totals: {
            total: totalLogs,
            today: todayLogs,
            thisWeek: weekLogs,
            thisMonth: monthLogs
          },
          topActions: topActions.map(action => ({
            action: action.action,
            count: action._count.action
          })),
          topUsers: topUsersWithDetails,
          recentActivities
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export audit logs as CSV
   */
  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const action = req.query.action as string;
      const resourceType = req.query.resourceType as string;

      // Build where clause
      const where: any = {};

      if (action) {
        where.action = { contains: action, mode: 'insensitive' };
      }

      if (resourceType) {
        where.resourceType = resourceType;
      }

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
          where.timestamp.lte = new Date(endDate);
        }
      }

      const auditLogs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              role: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      // Generate CSV content
      const csvHeaders = [
        'ID',
        'User Email',
        'User Role',
        'Action',
        'Resource Type',
        'Resource ID',
        'Details',
        'IP Address',
        'User Agent',
        'Timestamp'
      ];

      const csvRows = auditLogs.map(log => [
        log.id,
        log.user.email,
        log.user.role,
        log.action,
        log.resourceType || '',
        log.resourceId || '',
        log.details || '',
        log.ipAddress || '',
        log.userAgent || '',
        log.timestamp.toISOString()
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      return res.send(csvContent);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete old audit logs (cleanup utility)
   */
  async cleanup(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const daysToKeep = parseInt(req.body.daysToKeep) || 90; // Default 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      return res.json({
        success: true,
        message: `Deleted ${deletedCount.count} audit log entries older than ${daysToKeep} days`,
        data: {
          deletedCount: deletedCount.count,
          cutoffDate
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

// Utility function to log actions (can be used across controllers)
export const logAuditAction = async (
  userId: number,
  action: string,
  resourceType?: string,
  resourceId?: number,
  details?: string,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress: ipAddress || 'system',
        userAgent: userAgent || 'system'
      }
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw error to avoid breaking main functionality
  }
}; 