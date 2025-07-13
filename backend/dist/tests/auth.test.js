"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const auth_service_1 = require("../services/auth.service");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
(0, vitest_1.describe)('AuthService', () => {
    const testUser = {
        email: 'test@example.com',
        password: 'Test123!@#',
        role: 'ADMIN'
    };
    (0, vitest_1.beforeAll)(async () => {
        await prisma.user.deleteMany({
            where: {
                email: testUser.email
            }
        });
    });
    (0, vitest_1.afterAll)(async () => {
        await prisma.user.deleteMany({
            where: {
                email: testUser.email
            }
        });
        await prisma.$disconnect();
    });
    (0, vitest_1.it)('should register a new user', async () => {
        const result = await auth_service_1.AuthService.register(testUser.email, testUser.password, testUser.role);
        (0, vitest_1.expect)(result.user).toBeDefined();
        (0, vitest_1.expect)(result.user.email).toBe(testUser.email);
        (0, vitest_1.expect)(result.user.role).toBe(testUser.role);
        (0, vitest_1.expect)(result.token).toBeDefined();
        const decoded = jsonwebtoken_1.default.verify(result.token, process.env.JWT_SECRET || 'your-secret-key');
        (0, vitest_1.expect)(decoded.userId).toBeDefined();
    });
    (0, vitest_1.it)('should login existing user', async () => {
        const result = await auth_service_1.AuthService.login(testUser.email, testUser.password);
        (0, vitest_1.expect)(result.user).toBeDefined();
        (0, vitest_1.expect)(result.user.email).toBe(testUser.email);
        (0, vitest_1.expect)(result.token).toBeDefined();
    });
    (0, vitest_1.it)('should fail with invalid credentials', async () => {
        await (0, vitest_1.expect)(auth_service_1.AuthService.login(testUser.email, 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });
    (0, vitest_1.it)('should change password successfully', async () => {
        const loginResult = await auth_service_1.AuthService.login(testUser.email, testUser.password);
        const newPassword = 'NewTest456!@#';
        await auth_service_1.AuthService.changePassword(loginResult.user.id, newPassword);
        const newLoginResult = await auth_service_1.AuthService.login(testUser.email, newPassword);
        (0, vitest_1.expect)(newLoginResult.user).toBeDefined();
        (0, vitest_1.expect)(newLoginResult.token).toBeDefined();
    });
});
//# sourceMappingURL=auth.test.js.map