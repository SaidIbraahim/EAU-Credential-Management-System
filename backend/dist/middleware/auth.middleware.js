"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const prisma_1 = require("../lib/prisma");
const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
            throw new errorHandler_1.AppError('No token provided', 401);
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new errorHandler_1.AppError('No token provided', 401);
        }
        const secret = process.env.JWT_SECRET || 'default-secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
            }
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 401);
        }
        if (!user.isActive) {
            throw new errorHandler_1.AppError('Your account has been deactivated. Please contact the administrator.', 403);
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errorHandler_1.AppError('Invalid token', 401));
        }
        else if (error instanceof errorHandler_1.AppError) {
            next(error);
        }
        else {
            next(new errorHandler_1.AppError('Authentication failed', 401));
        }
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new errorHandler_1.AppError('Not authenticated', 401);
        }
        if (!req.user.isActive) {
            throw new errorHandler_1.AppError('Your account has been deactivated. Please contact the administrator.', 403);
        }
        if (!roles.includes(req.user.role)) {
            throw new errorHandler_1.AppError('Not authorized', 403);
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map