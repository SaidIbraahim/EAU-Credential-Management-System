import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateLogin, validateChangePassword, validateUpdateProfile } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validateLogin, (req, res, next) => authController.login(req, res, next));
router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/verify-reset-code', (req, res, next) => authController.verifyResetCode(req, res, next));
router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res, next));

// Protected routes
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
router.get('/profile', authenticate, (req, res, next) => authController.getProfile(req, res, next));
router.put('/profile', authenticate, validateUpdateProfile, (req, res, next) => authController.updateProfile(req, res, next));
router.post(
  '/change-password',
  authenticate,
  validateChangePassword,
  (req, res, next) => authController.changePassword(req, res, next)
);

export default router; 