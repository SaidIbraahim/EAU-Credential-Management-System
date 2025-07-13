import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters');

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
    role: z.enum(['ADMIN', 'SUPER_ADMIN']).default('ADMIN'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID format').transform(Number),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string(),
    newPassword: passwordSchema,
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID format').transform(Number),
  }),
});

export const getUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Invalid page number').transform(Number).optional(),
    limit: z.string().regex(/^\d+$/, 'Invalid limit number').transform(Number).optional(),
  }),
}); 