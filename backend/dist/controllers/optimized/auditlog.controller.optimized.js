"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedAuditLogController = void 0;
const prisma_1 = require("../../lib/prisma");
class OptimizedAuditLogController {
    async getAll(req, res, next) {
        try {
            console.time('⚡ Optimized Audit Log Query');
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
            const search = req.query.search;
            const action = req.query.action;
            const resourceType = req.query.resourceType;
            const userId = req.query.userId ? parseInt(req.query.userId) : undefined;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const skip = (page - 1) * limit;
            const where = {};
            if (search) {
                where.OR = [
                    { action: { contains: search, mode: 'insensitive' } },
                    { details: { contains: search, mode: 'insensitive' } }
                ];
            }
            if (action) {
                where.action = { contains: action, mode: 'insensitive' };
            }
            if (resourceType) {
                where.resourceType = resourceType;
            }
            if (userId) {
                where.userId = userId;
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
            const [total, auditLogs] = await Promise.all([
                prisma_1.prisma.auditLog.count({ where }),
                prisma_1.prisma.auditLog.findMany({
                    where,
                    select: {
                        id: true,
                        action: true,
                        resourceType: true,
                        resourceId: true,
                        details: true,
                        timestamp: true,
                        ipAddress: true,
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
        }
        catch (error) {
            next(error);
        }
    }
    async getStats(_req, res, next) {
        try {
            console.time('⚡ Optimized Audit Stats Query');
            const [statsResult, topActionsResult, topUsersResult] = await Promise.all([
                prisma_1.prisma.$queryRaw `
          SELECT 
            COUNT(*)::int as total,
            COUNT(CASE WHEN timestamp >= CURRENT_DATE THEN 1 END)::int as today,
            COUNT(CASE WHEN timestamp >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::int as this_week,
            COUNT(CASE WHEN timestamp >= CURRENT_DATE - INTERVAL '1 month' THEN 1 END)::int as this_month
          FROM audit_logs
        `,
                prisma_1.prisma.$queryRaw `
          SELECT action, COUNT(*)::int as count
          FROM audit_logs
          WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY action
          ORDER BY count DESC
          LIMIT 10
        `,
                prisma_1.prisma.$queryRaw `
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
            const stats = statsResult[0];
            const topActions = topActionsResult;
            const topUsers = topUsersResult;
            const recentActivities = await prisma_1.prisma.auditLog.findMany({
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
        }
        catch (error) {
            next(error);
        }
    }
    async getRecent(req, res, next) {
        try {
            console.time('⚡ Optimized Recent Audit Query');
            const limit = Math.min(50, parseInt(req.query.limit) || 10);
            const recentLogs = await prisma_1.prisma.auditLog.findMany({
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OptimizedAuditLogController = OptimizedAuditLogController;
exports.default = OptimizedAuditLogController;
//# sourceMappingURL=auditlog.controller.optimized.js.map