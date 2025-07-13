import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

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
  _next: NextFunction
) => {
  let statusCode = 500;
  const response: ErrorResponse = {
    status: 'error',
    message: 'Internal server error',
  };

  // Development vs Production error details
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Handle different types of errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    response.message = 'Validation error';
    response.errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  } else if (err instanceof PrismaClientKnownRequestError) {
    // Handle Prisma specific errors
    const prismaError = err as PrismaError;
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        response.message = 'Unique constraint violation';
        break;
      case 'P2025':
        statusCode = 404;
        response.message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        response.message = 'Foreign key constraint violation';
        break;
      default:
        statusCode = 400;
        response.message = 'Database error';
    }
  } else if (err instanceof PrismaClientValidationError) {
    statusCode = 400;
    response.message = 'Invalid data provided';
  }

  // Log error for monitoring
  console.error(
    `[${new Date().toISOString()}] ${statusCode} - ${err.message}`,
    {
      path: req.path,
      method: req.method,
      error: err,
    }
  );

  res.status(statusCode).json(response);
}; 