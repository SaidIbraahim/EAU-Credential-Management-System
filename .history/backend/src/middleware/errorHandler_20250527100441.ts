import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { CustomError } from '../utils/customError';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public operational = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponse {
  status: 'error';
  message: string;
  errors?: any[];
  stack?: string;
}

interface PrismaError extends Error {
  code: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  if (err instanceof CustomError) {
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