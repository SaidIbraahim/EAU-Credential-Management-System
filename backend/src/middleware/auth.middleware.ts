import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { prisma } from '../lib/prisma';

// Define the user payload interface
export interface AuthUser {
  id: number;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
}

// In-memory user cache to reduce database queries
interface CachedUser extends AuthUser {
  cachedAt: number;
}

const userCache = new Map<number, CachedUser>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Helper to get cached user or fetch from database
const getCachedUser = async (userId: number): Promise<AuthUser | null> => {
  const cached = userCache.get(userId);
  const now = Date.now();
  
  // Return cached user if still valid
  if (cached && (now - cached.cachedAt) < CACHE_TTL) {
    return {
      id: cached.id,
      email: cached.email,
      role: cached.role,
      isActive: cached.isActive
    };
  }
  
  // Fetch from database and cache
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      }
    });

    if (user) {
      // Cache the user data
      userCache.set(userId, {
        ...user,
        cachedAt: now
      });
      
      return user;
    }
    
    return null;
  } catch (error) {
    console.error('Database error in auth middleware:', error);
    // If database is down, try to use cached data even if expired
    if (cached) {
      console.warn('⚠️ Using expired cached user data due to database error');
      return {
        id: cached.id,
        email: cached.email,
        role: cached.role,
        isActive: cached.isActive
      };
    }
    throw error;
  }
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { userId: number };

    // Fetch user from database to ensure they still exist and get current info
    const user = await getCachedUser(decoded.userId);

    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Check if user account is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact the administrator.', 403);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

export const authorize = (...roles: Array<'ADMIN' | 'SUPER_ADMIN'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    // Double-check user is still active
    if (!req.user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact the administrator.', 403);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Not authorized', 403);
    }

    next();
  };
}; 