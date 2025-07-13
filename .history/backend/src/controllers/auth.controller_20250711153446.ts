import { Request, Response, NextFunction } from 'express';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { EmailService } from '../services/email.service';
import { userAuthCache } from '../config/cache';

// In-memory storage for verification codes (in production, use Redis)
const verificationCodes = new Map<string, { code: string; expiresAt: Date; email: string }>();

export class AuthController {
  /**
   * ULTRA OPTIMIZED LOGIN: Uses application-level caching
   * Target: 644ms → <100ms (85% improvement)
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Ultra-Fast Login Process');
      
      const { email, password } = req.body;

      // STEP 1: Check cache first (should be <10ms)
      let user = userAuthCache.get(email);
      let fromCache = false;

      if (user) {
        console.log('⚡ User served from cache (ultra-fast path)');
        fromCache = true;
      } else {
        // STEP 2: Cache miss - fetch from database with optimized query
        console.log('🔍 Cache miss - fetching from database');
        console.time('⚡ Database User Fetch');
        
        const dbUser = await prisma.user.findUnique({
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
          throw new AppError('Invalid credentials', 401);
        }

        // Cache the user for future requests
        user = dbUser as any;
        userAuthCache.set(email, user);
        console.log('💾 User cached for future fast access');
      }

      // STEP 3: Security checks (always performed)
      if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact the administrator for assistance.', 403);
      }

      if (!user.passwordHash) {
        throw new AppError('Account not properly configured. Please contact administrator.', 401);
      }

      // STEP 4: Password verification (CPU-bound, can't cache this)
      console.time('⚡ Password Verification');
      const isPasswordValid = await compare(password, user.passwordHash);
      console.timeEnd('⚡ Password Verification');
      
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // STEP 5: Generate JWT token
      console.time('⚡ JWT Generation');
      const token = sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '1d' }
      );
      console.timeEnd('⚡ JWT Generation');

      // STEP 6: Prepare response (exclude sensitive data)
      const { passwordHash, ...userResponse } = user;

      console.timeEnd('⚡ Ultra-Fast Login Process');

      // STEP 7: Update lastLogin ASYNCHRONOUSLY (non-blocking)
      if (!fromCache) {
        setImmediate(async () => {
          try {
            const updatedUser = await prisma.user.update({
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

            // Update cache with new lastLogin
            userAuthCache.set(email, updatedUser as any);
            console.log(`⚡ Async lastLogin updated and cache refreshed for user ${user.id}`);
          } catch (error) {
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
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if email exists or not
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store verification code
      verificationCodes.set(email, { code, expiresAt, email });

      // Send email with verification code
      try {
        await EmailService.sendPasswordResetEmail(email, code);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        throw new AppError('Failed to send password reset email', 500);
      }

      return res.json({
        success: true,
        message: 'Password reset verification code sent to your email.'
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyResetCode(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, code } = req.body;

      const verification = verificationCodes.get(email);
      if (!verification) {
        throw new AppError('Invalid or expired verification code', 400);
      }

      if (verification.code !== code) {
        throw new AppError('Invalid verification code', 400);
      }

      if (new Date() > verification.expiresAt) {
        verificationCodes.delete(email);
        throw new AppError('Verification code has expired', 400);
      }

      return res.json({
        success: true,
        message: 'Verification code is valid'
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, code, newPassword } = req.body;

      const verification = verificationCodes.get(email);
      if (!verification || verification.code !== code || new Date() > verification.expiresAt) {
        throw new AppError('Invalid or expired verification code', 400);
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const hashedPassword = await hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          mustChangePassword: false,
        },
      });

      // Clear verification code
      verificationCodes.delete(email);

      // IMPORTANT: Clear cache when password changes
      userAuthCache.invalidate(email);
      console.log(`🔐 User cache cleared after password reset: ${email}`);

      return res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Optional: Clear user from cache on logout for security
      const user = (req as any).user;
      if (user?.email) {
        userAuthCache.invalidate(user.email);
        console.log(`🔐 User cache cleared on logout: ${user.email}`);
      }

      return res.json({
        data: {
          message: 'Logout successful'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = (req as any).user.id;

      const user = await prisma.user.findUnique({
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
        throw new AppError('User not found', 404);
      }

      // Additional check: if user becomes inactive while logged in
      if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact the administrator.', 403);
      }

      return res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const isCurrentPasswordValid = await compare(currentPassword, user.passwordHash!);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      const hashedNewPassword = await hash(newPassword, 10);

      const updatedUser = await prisma.user.update({
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

      // IMPORTANT: Clear cache when password changes
      userAuthCache.invalidate(user.email);
      console.log(`🔐 User cache cleared after password change: ${user.email}`);

      return res.json({
        data: {
          user: updatedUser,
          message: 'Password changed successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const stats = userAuthCache.getStats();
      return res.json({
        success: true,
        data: {
          cache: stats,
          message: 'User authentication cache statistics'
        }
      });
    } catch (error) {
      next(error);
    }
  }
} 