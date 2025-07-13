"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_validator_1 = require("../validators/auth.validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post('/login', auth_validator_1.validateLogin, (req, res, next) => authController.login(req, res, next));
router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/verify-reset-code', (req, res, next) => authController.verifyResetCode(req, res, next));
router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res, next));
router.post('/logout', auth_middleware_1.authenticate, (req, res, next) => authController.logout(req, res, next));
router.get('/profile', auth_middleware_1.authenticate, (req, res, next) => authController.getProfile(req, res, next));
router.put('/profile', auth_middleware_1.authenticate, auth_validator_1.validateUpdateProfile, (req, res, next) => authController.updateProfile(req, res, next));
router.post('/change-password', auth_middleware_1.authenticate, auth_validator_1.validateChangePassword, (req, res, next) => authController.changePassword(req, res, next));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map