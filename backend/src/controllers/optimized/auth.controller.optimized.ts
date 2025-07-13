import { Request, Response, NextFunction } from 'express';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';

// Simple cache for user lookups (5 minute TTL)
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class OptimizedAuthController {
  /**
   * OPTIMIZED: Login with selective field loading and async session updates
   * Target: 642ms → 80-120ms (80% improvement)
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Optimized Login Process');
      
      const { email, password } = req.body;

      // Check cache first (for repeated login attempts)
      const cacheKey = `user_${email.toLowerCase()}`;
      const cached = userCache.get(cacheKey);
      
      let user;
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('⚡ User served from cache');
        user = cached.user;
      } else {
        // OPTIMIZATION 1: Selective field loading for auth
        user = await prisma.user.findUnique({
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

        // Cache the user for subsequent requests
        if (user) {
          userCache.set(cacheKey, { user, timestamp: Date.now() });
        }
      }

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if user account is active
      if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact the administrator for assistance.', 403);
      }

      // Check if user has a password set
      if (!user.passwordHash) {
        throw new AppError('Account not properly configured. Please contact administrator.', 401);
      }

      // OPTIMIZATION 2: Password verification
      const isPasswordValid = await compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // OPTIMIZATION 3: Generate JWT immediately
      const token = sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '1d' }
      );

      // Prepare response data (exclude password hash)
      const { passwordHash, ...userResponse } = user;

      console.timeEnd('⚡ Optimized Login Process');

      // OPTIMIZATION 4: Update lastLogin asynchronously (non-blocking)
      setImmediate(async () => {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });
          // Update cache with new lastLogin
          userCache.set(cacheKey, { 
            user: { ...user, lastLogin: new Date() }, 
            timestamp: Date.now() 
          });
          console.log(`⚡ Async lastLogin updated for user ${user.id}`);
        } catch (error) {
          console.warn('Warning: Failed to update lastLogin:', error);
        }
      });

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

  /**
   * OPTIMIZED: Get user profile with cache
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.time('⚡ Optimized Profile Query');
      
      const userId = (req as any).user.id;
      const cacheKey = `profile_${userId}`;
      
      // Check cache first
      const cached = userCache.get(cacheKey);
      let user;
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('⚡ Profile served from cache');
        user = cached.user;
      } else {
        user = await prisma.user.findUnique({
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
        throw new AppError('User not found', 404);
      }

      // Additional check: if user becomes inactive while logged in
      if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact the administrator.', 403);
      }

      console.timeEnd('⚡ Optimized Profile Query');

      return res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear user cache (for testing or after user updates)
   */
  static clearCache(email?: string) {
    if (email) {
      userCache.delete(`user_${email.toLowerCase()}`);
      console.log(`⚡ Cleared cache for user: ${email}`);
    } else {
      userCache.clear();
      console.log('⚡ Cleared all user cache');
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    const now = Date.now();
    const activeEntries = Array.from(userCache.entries()).filter(
      ([_, entry]) => now - entry.timestamp < CACHE_TTL
    );
    
    return {
      totalEntries: userCache.size,
      activeEntries: activeEntries.length,
      cacheHitRate: userCache.size > 0 ? (activeEntries.length / userCache.size) * 100 : 0
    };
  }
}

export default OptimizedAuthController; 