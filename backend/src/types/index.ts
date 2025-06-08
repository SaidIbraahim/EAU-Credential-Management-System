import { Request } from 'express';
import { AuthUser } from '../middleware/auth.middleware';

export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
} 