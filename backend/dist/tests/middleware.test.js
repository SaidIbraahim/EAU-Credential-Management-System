"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const validate_1 = require("../middleware/validate");
const auth_middleware_1 = require("../middleware/auth.middleware");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
vitest_1.vi.mock('@prisma/client', () => {
    const mockPrismaClient = vitest_1.vi.fn(() => ({
        user: {
            findUnique: vitest_1.vi.fn().mockImplementation((params) => {
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
(0, vitest_1.describe)('Middleware Tests', () => {
    (0, vitest_1.describe)('Validation Middleware', () => {
        const schema = zod_1.z.object({
            body: zod_1.z.object({
                username: zod_1.z.string().min(3),
                email: zod_1.z.string().email()
            })
        });
        (0, vitest_1.it)('should pass valid data', async () => {
            const req = {
                body: {
                    username: 'testuser',
                    email: 'test@example.com'
                }
            };
            const res = {};
            const next = vitest_1.vi.fn();
            await (0, validate_1.validate)(schema)(req, res, next);
            (0, vitest_1.expect)(next).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should reject invalid data', async () => {
            const req = {
                body: {
                    username: 'te',
                    email: 'invalid-email'
                }
            };
            const res = {
                status: vitest_1.vi.fn().mockReturnThis(),
                json: vitest_1.vi.fn()
            };
            const next = vitest_1.vi.fn();
            await (0, validate_1.validate)(schema)(req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                status: 'error',
                message: 'Validation failed'
            }));
        });
    });
    (0, vitest_1.describe)('Authentication Middleware', () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            role: 'ADMIN',
            isActive: true
        };
        (0, vitest_1.it)('should authenticate valid token', async () => {
            var _a;
            const token = jsonwebtoken_1.default.sign({ userId: mockUser.id, role: mockUser.role }, process.env.JWT_SECRET || 'your-secret-key');
            const req = {
                headers: {
                    authorization: `Bearer ${token}`
                }
            };
            const res = {
                status: vitest_1.vi.fn().mockReturnThis(),
                json: vitest_1.vi.fn()
            };
            const next = vitest_1.vi.fn();
            await (0, auth_middleware_1.authenticate)(req, res, next);
            (0, vitest_1.expect)(next).toHaveBeenCalled();
            (0, vitest_1.expect)(req.user).toBeDefined();
            (0, vitest_1.expect)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id).toBe(mockUser.id);
        });
        (0, vitest_1.it)('should reject invalid token', async () => {
            const req = {
                headers: {
                    authorization: 'Bearer invalid-token'
                }
            };
            const res = {
                status: vitest_1.vi.fn().mockReturnThis(),
                json: vitest_1.vi.fn()
            };
            const next = vitest_1.vi.fn();
            await (0, auth_middleware_1.authenticate)(req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                status: 'error',
                message: 'Invalid token'
            }));
        });
    });
    (0, vitest_1.describe)('Authorization Middleware', () => {
        (0, vitest_1.it)('should allow authorized user', () => {
            const req = {
                user: {
                    id: 1,
                    role: 'ADMIN'
                }
            };
            const res = {};
            const next = vitest_1.vi.fn();
            (0, auth_middleware_1.authorize)('ADMIN')(req, res, next);
            (0, vitest_1.expect)(next).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should reject unauthorized user', () => {
            const req = {
                user: {
                    id: 1,
                    role: 'ADMIN'
                }
            };
            const res = {
                status: vitest_1.vi.fn().mockReturnThis(),
                json: vitest_1.vi.fn()
            };
            const next = vitest_1.vi.fn();
            (0, auth_middleware_1.authorize)('SUPER_ADMIN')(req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                status: 'error',
                message: 'Not authorized'
            }));
        });
    });
});
//# sourceMappingURL=middleware.test.js.map