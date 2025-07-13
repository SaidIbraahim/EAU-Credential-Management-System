"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.validateUpdateProfile = exports.validateChangePassword = exports.validateLogin = void 0;
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(6, 'Current password must be at least 6 characters'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
const updateProfileSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').optional(),
});
const validateLogin = (req, res, next) => {
    try {
        loginSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                status: 'error',
                message: error.errors[0].message,
            });
        }
        else {
            next(error);
        }
    }
};
exports.validateLogin = validateLogin;
const validateChangePassword = (req, res, next) => {
    try {
        changePasswordSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                status: 'error',
                message: error.errors[0].message,
            });
        }
        else {
            next(error);
        }
    }
};
exports.validateChangePassword = validateChangePassword;
const validateUpdateProfile = (req, res, next) => {
    try {
        updateProfileSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                status: 'error',
                message: error.errors[0].message,
            });
        }
        else {
            next(error);
        }
    }
};
exports.validateUpdateProfile = validateUpdateProfile;
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        role: zod_1.z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
    }),
});
//# sourceMappingURL=auth.validator.js.map