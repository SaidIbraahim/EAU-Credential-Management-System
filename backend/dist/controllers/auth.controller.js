"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = require("bcrypt");
const jsonwebtoken_1 = require("jsonwebtoken");
const prisma_1 = require("../lib/prisma");
const AppError_1 = require("../utils/AppError");
const email_service_1 = require("../services/email.service");
const cache_1 = require("../config/cache");
const verificationCodes = new Map();
class AuthController {
    async login(req, res, next) {
        try {
            console.time('⚡ Ultra-Fast Login Process');
            const { email, password } = req.body;
            let user = cache_1.userAuthCache.get(email);
            let fromCache = false;
            if (user) {
                console.log('⚡ User served from cache (ultra-fast path)');
                fromCache = true;
            }
            else {
                console.log('🔍 Cache miss - fetching from database');
                console.time('⚡ Database User Fetch');
                const dbUser = await prisma_1.prisma.user.findUnique({
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
                console.timeEnd('⚡ Database User Fetch');
                if (!dbUser) {
                    throw new AppError_1.AppError('Invalid credentials', 401);
                }
                user = dbUser;
                cache_1.userAuthCache.set(email, user);
                console.log('💾 User cached for future fast access');
            }
            if (!user) {
                throw new AppError_1.AppError('User not found', 401);
            }
            if (!user.isActive) {
                throw new AppError_1.AppError('Your account has been deactivated. Please contact the administrator for assistance.', 403);
            }
            if (!user.passwordHash) {
                throw new AppError_1.AppError('Account not properly configured. Please contact administrator.', 401);
            }
            console.time('⚡ Password Verification');
            const isPasswordValid = await (0, bcrypt_1.compare)(password, user.passwordHash);
            console.timeEnd('⚡ Password Verification');
            if (!isPasswordValid) {
                throw new AppError_1.AppError('Invalid credentials', 401);
            }
            console.time('⚡ JWT Generation');
            const token = (0, jsonwebtoken_1.sign)({ userId: user.id }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '1d' });
            console.timeEnd('⚡ JWT Generation');
            const { passwordHash, ...userResponse } = user;
            console.timeEnd('⚡ Ultra-Fast Login Process');
            if (!fromCache && user) {
                setImmediate(async () => {
                    try {
                        const updatedUser = await prisma_1.prisma.user.update({
                            where: { id: user.id },
                            data: { lastLogin: new Date() },
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
                        cache_1.userAuthCache.set(email, updatedUser);
                        console.log(`⚡ Async lastLogin updated and cache refreshed for user ${user.id}`);
                    }
                    catch (error) {
                        console.warn('Warning: Failed to update lastLogin:', error);
                    }
                });
            }
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
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            const user = await prisma_1.prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                return res.json({
                    success: true,
                    message: 'If an account with that email exists, a password reset link has been sent.'
                });
            }
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
            verificationCodes.set(email, { code, expiresAt, email });
            try {
                await email_service_1.EmailService.sendPasswordResetEmail(email, code);
            }
            catch (emailError) {
                console.error('Failed to send password reset email:', emailError);
                throw new AppError_1.AppError('Failed to send password reset email', 500);
            }
            return res.json({
                success: true,
                message: 'Password reset verification code sent to your email.'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyResetCode(req, res, next) {
        try {
            const { email, code } = req.body;
            const verification = verificationCodes.get(email);
            if (!verification) {
                throw new AppError_1.AppError('Invalid or expired verification code', 400);
            }
            if (verification.code !== code) {
                throw new AppError_1.AppError('Invalid verification code', 400);
            }
            if (new Date() > verification.expiresAt) {
                verificationCodes.delete(email);
                throw new AppError_1.AppError('Verification code has expired', 400);
            }
            return res.json({
                success: true,
                message: 'Verification code is valid'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const { email, code, newPassword } = req.body;
            const verification = verificationCodes.get(email);
            if (!verification || verification.code !== code || new Date() > verification.expiresAt) {
                throw new AppError_1.AppError('Invalid or expired verification code', 400);
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                throw new AppError_1.AppError('User not found', 404);
            }
            const hashedPassword = await (0, bcrypt_1.hash)(newPassword, 10);
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: hashedPassword,
                    mustChangePassword: false,
                },
            });
            verificationCodes.delete(email);
            cache_1.userAuthCache.invalidate(email);
            console.log(`🔐 User cache cleared after password reset: ${email}`);
            return res.json({
                success: true,
                message: 'Password reset successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const user = req.user;
            if (user === null || user === void 0 ? void 0 : user.email) {
                cache_1.userAuthCache.invalidate(user.email);
                console.log(`🔐 User cache cleared on logout: ${user.email}`);
            }
            return res.json({
                data: {
                    message: 'Logout successful'
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const user = await prisma_1.prisma.user.findUnique({
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
            if (!user) {
                throw new AppError_1.AppError('User not found', 404);
            }
            if (!user.isActive) {
                throw new AppError_1.AppError('Your account has been deactivated. Please contact the administrator.', 403);
            }
            return res.json({ data: user });
        }
        catch (error) {
            next(error);
        }
    }
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new AppError_1.AppError('User not found', 404);
            }
            const isCurrentPasswordValid = await (0, bcrypt_1.compare)(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                throw new AppError_1.AppError('Current password is incorrect', 400);
            }
            const hashedNewPassword = await (0, bcrypt_1.hash)(newPassword, 10);
            const updatedUser = await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    passwordHash: hashedNewPassword,
                    mustChangePassword: false,
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
            cache_1.userAuthCache.invalidate(user.email);
            console.log(`🔐 User cache cleared after password change: ${user.email}`);
            return res.json({
                data: {
                    user: updatedUser,
                    message: 'Password changed successfully'
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const { email } = req.body;
            const userId = req.user.id;
            const currentUser = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!currentUser) {
                throw new AppError_1.AppError('User not found', 404);
            }
            if (email && email !== currentUser.email) {
                const existingUser = await prisma_1.prisma.user.findFirst({
                    where: {
                        email: email.toLowerCase().trim(),
                        id: { not: userId }
                    }
                });
                if (existingUser) {
                    throw new AppError_1.AppError('Email address is already in use', 409);
                }
            }
            const updatedUser = await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    email: email ? email.toLowerCase().trim() : currentUser.email,
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
            if (email && email !== currentUser.email) {
                cache_1.userAuthCache.invalidate(currentUser.email);
                console.log(`📧 User cache cleared after email change: ${currentUser.email} -> ${email}`);
            }
            return res.json({
                data: updatedUser,
                message: 'Profile updated successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCacheStats(_req, res, next) {
        try {
            const stats = cache_1.userAuthCache.getStats();
            return res.json({
                success: true,
                data: {
                    cache: stats,
                    message: 'User authentication cache statistics'
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map