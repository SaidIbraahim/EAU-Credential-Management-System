import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

type Role = 'ADMIN' | 'SUPER_ADMIN' | 'USER';

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized - No user found' });
    }

    if (!authReq.user.role) {
      return res.status(403).json({ error: 'Forbidden - No role assigned' });
    }

    if (!allowedRoles.includes(authReq.user.role as Role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    next();
  };
}; 