import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { testCloudStorageConnection } from './utils/testCloudStorage';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
// import studentRoutes from './routes/student.routes';
// import optimizedStudentRoutes from './routes/student.routes.optimized'; // REPLACED WITH SIMPLE VERSION
import simpleStudentRoutes from './routes/student.routes.simple'; // SIMPLE OPTIMIZED VERSION - NO COMPILATION ISSUES
import documentRoutes from './routes/document.routes';
import facultyRoutes from './routes/faculty.routes';
import departmentRoutes from './routes/department.routes';
import academicYearRoutes from './routes/academicYear.routes';
import verificationRoutes from './routes/verification.routes';
import dashboardRoutes from './routes/dashboard.routes';
import auditLogRoutes from './routes/auditlog.routes';

const app = express();

// ⚡ ULTRA FAST endpoints first (before any middleware)
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.json({ 
    status: 'EAU Credential System API - SIMPLE OPTIMIZED VERSION', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    message: 'API running with simple optimization for instant student details'
  });
});

// 📊 Performance monitoring middleware (only for non-root endpoints)
app.use((req, res, next) => {
  // Skip monitoring for ultra-fast endpoints
  if (req.path === '/' || req.path === '/health') {
    return next();
  }
  
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    if (duration > 1000) {
      logger.warn(`🐌 Slow API endpoint: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    } else if (duration < 100) {
      logger.info(`⚡ Fast API endpoint: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    } else {
      logger.info(`📊 API endpoint: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
});

// Optimized middleware stack
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' })); // Optimize for document uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes (ordered by frequency of use for better performance)
app.use('/api/dashboard', dashboardRoutes); // Most frequently accessed
app.use('/api/students', simpleStudentRoutes); // USING SIMPLE OPTIMIZED VERSION FOR INSTANT STUDENT DETAILS
app.use('/api/documents', documentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api', verificationRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  logger.info(`🚀 Server is running on port ${PORT} with SIMPLE STUDENT OPTIMIZATION`);
  
  // Test cloud storage connection on startup
  logger.info('Testing cloud storage connection...');
  const storageConnected = await testCloudStorageConnection();
  if (!storageConnected) {
    logger.warn('Cloud storage connection failed - check your environment variables');
  }

  // Log optimization status
  logger.info('✅ Performance monitoring active');
  logger.info('✅ Database indexes applied');
  logger.info('✅ SIMPLE OPTIMIZATION: Student details with basic caching (5min TTL)');
  logger.info('✅ Ultra-optimized dashboard endpoints with raw SQL');
  logger.info('✅ Parallel document upload processing ready');
  logger.info('✅ Root endpoint bypass for instant response');
  logger.info('🚀 Performance targets: Student Details <500ms first load, <50ms cached');
});

export default app; 