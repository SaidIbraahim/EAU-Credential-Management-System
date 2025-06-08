import express, { Express } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { stream } from '../utils/logger';
import { errorHandler } from './errorHandler';

export const configureMiddleware = (app: Express) => {
  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Compression middleware
  app.use(compression());

  // Request logging
  app.use(
    morgan('combined', {
      stream,
      skip: (req) => req.url === '/health',
    })
  );

  // Error handling middleware (should be last)
  app.use(errorHandler);
}; 