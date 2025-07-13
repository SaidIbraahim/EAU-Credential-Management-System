"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const customError_1 = require("../utils/customError");
const prisma = new client_1.PrismaClient();
class AuthService {
    static generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };
        return jsonwebtoken_1.default.sign(payload, AuthService.JWT_SECRET, { expiresIn: AuthService.JWT_EXPIRES_IN });
    }
    static async login(email, password) {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new customError_1.CustomError(401, 'Invalid credentials');
        }
        if (!user.passwordHash) {
            throw new customError_1.CustomError(401, 'Account not properly configured. Please contact administrator.');
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new customError_1.CustomError(401, 'Invalid credentials');
        }
        return {
            token: AuthService.generateToken(user),
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
        };
    }
    static async register(email, password, role = 'ADMIN') {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new customError_1.CustomError(400, 'Email already exists');
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role
            },
        });
        return {
            token: AuthService.generateToken(user),
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
        };
    }
    static async changePassword(userId, newPassword) {
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword
            },
        });
        return { message: 'Password updated successfully' };
    }
}
exports.AuthService = AuthService;
AuthService.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
AuthService.JWT_EXPIRES_IN = '24h';
//# sourceMappingURL=auth.service.js.map