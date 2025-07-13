"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class UserService {
    static async createUser(data) {
        var _a;
        const { password, ...rest } = data;
        const existingUser = await prisma.user.findFirst({
            where: {
                email: data.email
            }
        });
        if (existingUser) {
            throw new errorHandler_1.AppError('User with this email already exists', 409);
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                ...rest,
                passwordHash,
                isActive: true,
                mustChangePassword: false
            },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                mustChangePassword: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        logger_1.logger.info(`User created: ${user.email}`);
        return {
            ...user,
            lastLogin: (_a = user.lastLogin) === null || _a === void 0 ? void 0 : _a.toISOString(),
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
    }
    static async getUsers(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true,
                    mustChangePassword: true,
                    lastLogin: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.user.count()
        ]);
        const formattedUsers = users.map(user => {
            var _a;
            return ({
                ...user,
                lastLogin: (_a = user.lastLogin) === null || _a === void 0 ? void 0 : _a.toISOString(),
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            });
        });
        return {
            users: formattedUsers,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    }
    static async getUserById(id) {
        var _a;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                mustChangePassword: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        return {
            ...user,
            lastLogin: (_a = user.lastLogin) === null || _a === void 0 ? void 0 : _a.toISOString(),
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
    }
    static async updateUser(id, data) {
        var _a;
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        if (data.email) {
            const duplicate = await prisma.user.findFirst({
                where: {
                    email: data.email,
                    NOT: { id }
                }
            });
            if (duplicate) {
                throw new errorHandler_1.AppError('Email already in use', 409);
            }
        }
        const updatedUser = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                mustChangePassword: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        logger_1.logger.info(`User updated: ${updatedUser.email}`);
        return {
            ...updatedUser,
            lastLogin: (_a = updatedUser.lastLogin) === null || _a === void 0 ? void 0 : _a.toISOString(),
            createdAt: updatedUser.createdAt.toISOString(),
            updatedAt: updatedUser.updatedAt.toISOString(),
        };
    }
    static async changePassword(id, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        if (!user.passwordHash) {
            throw new errorHandler_1.AppError('No password currently set. Please contact administrator.', 400);
        }
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new errorHandler_1.AppError('Current password is incorrect', 401);
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma.user.update({
            where: { id },
            data: {
                passwordHash,
                mustChangePassword: false
            }
        });
        logger_1.logger.info(`Password changed for user: ${user.email}`);
        return { message: 'Password updated successfully' };
    }
    static async deleteUser(id) {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        await prisma.$transaction(async (tx) => {
            const auditLogCount = await tx.auditLog.count({
                where: { userId: id }
            });
            await tx.auditLog.deleteMany({
                where: { userId: id }
            });
            await tx.user.delete({
                where: { id }
            });
            logger_1.logger.info(`User deleted: ${user.email} (including ${auditLogCount} audit log records)`);
        });
        return { message: 'User deleted successfully' };
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map