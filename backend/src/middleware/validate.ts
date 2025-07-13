import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { CustomError } from '../utils/customError';

export const validate = (schema: AnyZodObject) => async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = new CustomError(
        400,
        'Validation failed',
        error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }))
      );
      next(validationError);
    } else {
      next(error);
    }
  }
}; 