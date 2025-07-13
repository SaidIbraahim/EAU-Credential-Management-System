import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
    role: z.enum(['ADMIN', 'SUPER_ADMIN']).default('ADMIN'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
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
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID format').transform(Number),
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