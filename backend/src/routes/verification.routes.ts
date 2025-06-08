import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';

const router = Router();

// Public verification endpoint - no authentication required
router.get('/verify/:identifier', VerificationController.verifyStudent);

export default router; 