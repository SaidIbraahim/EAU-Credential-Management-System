import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// TODO: Implement student routes
// This file will be implemented when we work on student management features

export default router; 