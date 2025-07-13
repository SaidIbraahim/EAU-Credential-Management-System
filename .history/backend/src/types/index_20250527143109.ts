import { Request } from 'express';

export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
}

export interface AuthenticatedRequest extends Request {
  user?: User;
} 