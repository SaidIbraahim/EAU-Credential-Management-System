"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditAction = exports.AuditLogController = void 0;
const prisma_1 = require("../lib/prisma");
const AppError_1 = require("../utils/AppError");
class AuditLogController {
    async getAll(req, res, next) {
        try {
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
                    { details: { contains: search, mode: 'insensitive' } },
                    { user: { email: { contains: search, mode: 'insensitive' } } }
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
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                throw new AppError_1.AppError('Invalid audit log ID', 400);
            }
            const auditLog = await prisma_1.prisma.auditLog.findUnique({
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
                throw new AppError_1.AppError('Audit log not found', 404);
            }
            return res.json({
                success: true,
                data: auditLog
            });
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const user = req.user;
            const { action, resourceType, resourceId, details } = req.body;
            if (!action) {
                throw new AppError_1.AppError('Action is required', 400);
            }
            console.time('⚡ Ultra-Fast Audit Log Creation');
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
            const userAgent = req.get('User-Agent') || 'unknown';
            const auditLog = await prisma_1.prisma.auditLog.create({
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
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role
                    }
                }
            });
        }
        catch (error) {
            console.error('❌ Audit log creation error:', error);
            next(error);
        }
    }
    async getStats(_req, res, next) {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const [totalLogs, todayLogs, weekLogs, monthLogs, topActions, topUsers, recentActivities] = await Promise.all([
                prisma_1.prisma.auditLog.count(),
                prisma_1.prisma.auditLog.count({
                    where: { timestamp: { gte: today } }
                }),
                prisma_1.prisma.auditLog.count({
                    where: { timestamp: { gte: thisWeek } }
                }),
                prisma_1.prisma.auditLog.count({
                    where: { timestamp: { gte: thisMonth } }
                }),
                prisma_1.prisma.auditLog.groupBy({
                    by: ['action'],
                    _count: { action: true },
                    orderBy: { _count: { action: 'desc' } },
                    take: 10
                }),
                prisma_1.prisma.auditLog.groupBy({
                    by: ['userId'],
                    _count: { userId: true },
                    orderBy: { _count: { userId: 'desc' } },
                    take: 10
                }),
                prisma_1.prisma.auditLog.findMany({
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
            const userIds = topUsers.map(u => u.userId);
            const users = await prisma_1.prisma.user.findMany({
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
        }
        catch (error) {
            next(error);
        }
    }
    async exportCsv(req, res, next) {
        try {
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const action = req.query.action;
            const resourceType = req.query.resourceType;
            const where = {};
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
            const auditLogs = await prisma_1.prisma.auditLog.findMany({
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
        }
        catch (error) {
            next(error);
        }
    }
    async cleanup(req, res, next) {
        try {
            const daysToKeep = parseInt(req.body.daysToKeep) || 90;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const deletedCount = await prisma_1.prisma.auditLog.deleteMany({
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuditLogController = AuditLogController;
const logAuditAction = async (userId, action, resourceType, resourceId, details, ipAddress, userAgent) => {
    try {
        await prisma_1.prisma.auditLog.create({
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
    }
    catch (error) {
        console.error('Failed to log audit action:', error);
    }
};
exports.logAuditAction = logAuditAction;
//# sourceMappingURL=auditlog.controller.js.map