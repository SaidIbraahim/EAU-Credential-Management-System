"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersSchema = exports.userIdSchema = exports.changePasswordSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const passwordSchema = zod_1.z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters');
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: passwordSchema,
        role: zod_1.z.enum(['ADMIN', 'SUPER_ADMIN']).default('ADMIN'),
    }),
});
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format').optional(),
        role: zod_1.z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Invalid ID format').transform(Number),
    }),
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string(),
        newPassword: passwordSchema,
    }),
});
exports.userIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Invalid ID format').transform(Number),
    }),
});
exports.getUsersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/, 'Invalid page number').transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/, 'Invalid limit number').transform(Number).optional(),
    }),
});
//# sourceMappingURL=user.validator.js.map