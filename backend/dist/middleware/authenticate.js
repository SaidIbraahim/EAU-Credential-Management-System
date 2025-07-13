"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const AppError_1 = require("../utils/AppError");
const authenticate = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError_1.AppError('No token provided', 401);
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || 'default-secret');
        req.user = { id: decoded.userId };
        next();
    }
    catch (error) {
        if (error instanceof Error) {
            next(new AppError_1.AppError(error.message, 401));
        }
        else {
            next(new AppError_1.AppError('Authentication failed', 401));
        }
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=authenticate.js.map