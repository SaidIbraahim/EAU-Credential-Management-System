import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  userIdSchema,
  getUsersSchema,
} from '../validators/user.validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all users (paginated)
router.get('/', validate(getUsersSchema), UserController.getUsers);

// Create new user
router.post('/', validate(createUserSchema), UserController.createUser);

// Get user by ID
router.get('/:id', validate(userIdSchema), UserController.getUserById);

// Update user
router.patch('/:id', validate(updateUserSchema), UserController.updateUser);

// Change password
router.post('/:id/change-password', validate(changePasswordSchema), UserController.changePassword);

// Delete user
router.delete('/:id', validate(userIdSchema), UserController.deleteUser);

export default router; 