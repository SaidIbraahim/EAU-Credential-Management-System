import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/customError';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  console.error('Error:', err);
  
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}; 