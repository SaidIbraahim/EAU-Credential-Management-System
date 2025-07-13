"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedAuthController = void 0;
const bcrypt_1 = require("bcrypt");
const jsonwebtoken_1 = require("jsonwebtoken");
const prisma_1 = require("../../lib/prisma");
const AppError_1 = require("../../utils/AppError");
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
class OptimizedAuthController {
    async login(req, res, next) {
        try {
            console.time('⚡ Optimized Login Process');
            const { email, password } = req.body;
            const cacheKey = `user_${email.toLowerCase()}`;
            const cached = userCache.get(cacheKey);
            let user;
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                console.log('⚡ User served from cache');
                user = cached.user;
            }
            else {
                user = await prisma_1.prisma.user.findUnique({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        passwordHash: true,
                        role: true,
                        isActive: true,
                        mustChangePassword: true,
                        lastLogin: true,
                        createdAt: true,
                        updatedAt: true
                    }
                });
                if (user) {
                    userCache.set(cacheKey, { user, timestamp: Date.now() });
                }
            }
            if (!user) {
                throw new AppError_1.AppError('Invalid credentials', 401);
            }
            if (!user.isActive) {
                throw new AppError_1.AppError('Your account has been deactivated. Please contact the administrator for assistance.', 403);
            }
            if (!user.passwordHash) {
                throw new AppError_1.AppError('Account not properly configured. Please contact administrator.', 401);
            }
            const isPasswordValid = await (0, bcrypt_1.compare)(password, user.passwordHash);
            if (!isPasswordValid) {
                throw new AppError_1.AppError('Invalid credentials', 401);
            }
            const token = (0, jsonwebtoken_1.sign)({ userId: user.id }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '1d' });
            const { passwordHash, ...userResponse } = user;
            console.timeEnd('⚡ Optimized Login Process');
            setImmediate(async () => {
                try {
                    await prisma_1.prisma.user.update({
                        where: { id: user.id },
                        data: { lastLogin: new Date() }
                    });
                    userCache.set(cacheKey, {
                        user: { ...user, lastLogin: new Date() },
                        timestamp: Date.now()
                    });
                    console.log(`⚡ Async lastLogin updated for user ${user.id}`);
                }
                catch (error) {
                    console.warn('Warning: Failed to update lastLogin:', error);
                }
            });
            return res.json({
                data: {
                    user: userResponse,
                    token,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getProfile(req, res, next) {
        try {
            console.time('⚡ Optimized Profile Query');
            const userId = req.user.id;
            const cacheKey = `profile_${userId}`;
            const cached = userCache.get(cacheKey);
            let user;
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                console.log('⚡ Profile served from cache');
                user = cached.user;
            }
            else {
                user = await prisma_1.prisma.user.findUnique({
                    where: { id: userId },
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
                });
                if (user) {
                    userCache.set(cacheKey, { user, timestamp: Date.now() });
                }
            }
            if (!user) {
                throw new AppError_1.AppError('User not found', 404);
            }
            if (!user.isActive) {
                throw new AppError_1.AppError('Your account has been deactivated. Please contact the administrator.', 403);
            }
            console.timeEnd('⚡ Optimized Profile Query');
            return res.json({ data: user });
        }
        catch (error) {
            next(error);
        }
    }
    static clearCache(email) {
        if (email) {
            userCache.delete(`user_${email.toLowerCase()}`);
            console.log(`⚡ Cleared cache for user: ${email}`);
        }
        else {
            userCache.clear();
            console.log('⚡ Cleared all user cache');
        }
    }
    static getCacheStats() {
        const now = Date.now();
        const activeEntries = Array.from(userCache.entries()).filter(([_, entry]) => now - entry.timestamp < CACHE_TTL);
        return {
            totalEntries: userCache.size,
            activeEntries: activeEntries.length,
            cacheHitRate: userCache.size > 0 ? (activeEntries.length / userCache.size) * 100 : 0
        };
    }
}
exports.OptimizedAuthController = OptimizedAuthController;
exports.default = OptimizedAuthController;
//# sourceMappingURL=auth.controller.optimized.js.map