import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// Re-export AppError for use in other modules
export { AppError };

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  console.error('Error:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}; 