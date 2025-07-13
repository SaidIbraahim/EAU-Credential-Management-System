import { describe, it, expect, vi } from 'vitest';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const mockPrismaClient = vi.fn(() => ({
    user: {
      findUnique: vi.fn().mockImplementation((params) => {
        if (params.where.id === 1) {
          return Promise.resolve({
            id: 1,
            username: 'testuser',
            role: 'ADMIN',
            isActive: true
          });
        }
        return Promise.resolve(null);
      })
    }
  }));
  return { PrismaClient: mockPrismaClient };
});

describe('Middleware Tests', () => {
  describe('Validation Middleware', () => {
    const schema = z.object({
      body: z.object({
        username: z.string().min(3),
        email: z.string().email()
      })
    });

    it('should pass valid data', async () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com'
        }
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      await validate(schema)(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid data', async () => {
      const req = {
        body: {
          username: 'te',
          email: 'invalid-email'
        }
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await validate(schema)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Validation failed'
        })
      );
    });
  });

  describe('Authentication Middleware', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      role: 'ADMIN' as const,
      isActive: true
    };

    it('should authenticate valid token', async () => {
      const token = jwt.sign(
        { userId: mockUser.id, role: mockUser.role },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await authenticate(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe(mockUser.id);
    });

    it('should reject invalid token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Invalid token'
        })
      );
    });
  });

  describe('Authorization Middleware', () => {
    it('should allow authorized user', () => {
      const req = {
        user: {
          id: 1,
          role: 'ADMIN'
        }
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      authorize('ADMIN')(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should reject unauthorized user', () => {
      const req = {
        user: {
          id: 1,
          role: 'ADMIN'
        }
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      authorize('SUPER_ADMIN')(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Not authorized'
        })
      );
    });
  });
}); 