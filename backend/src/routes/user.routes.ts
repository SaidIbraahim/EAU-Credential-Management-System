import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
} from '../validators/user.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), UserController.getUsers);

// Get user by ID (admin only)
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), UserController.getUserById);

// Create user (super admin only)
router.post('/', 
  authorize('SUPER_ADMIN'), 
  validate(createUserSchema), 
  UserController.createUser
);

// Update user (admin only)
router.put('/:id', 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  validate(updateUserSchema), 
  UserController.updateUser
);

// Change password (authenticated users)
router.post('/change-password', 
  validate(changePasswordSchema), 
  UserController.changePassword
);

// Delete user (super admin only)
router.delete('/:id', authorize('SUPER_ADMIN'), UserController.deleteUser);

export default router; 