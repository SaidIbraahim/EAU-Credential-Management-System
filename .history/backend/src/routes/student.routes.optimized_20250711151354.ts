import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import OptimizedStudentController from '../controllers/optimized/student.controller.optimized';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply admin authorization to all routes
router.use(authorize(['ADMIN', 'SUPER_ADMIN']));

// OPTIMIZED Routes - with performance monitoring
router.get('/', async (req, res, next) => {
  console.time('⚡ Student List Route');
  try {
    await OptimizedStudentController.getAll(req, res);
  } catch (error) {
    next(error);
  } finally {
    console.timeEnd('⚡ Student List Route');
  }
});

router.get('/search', async (req, res, next) => {
  console.time('⚡ Student Search Route');
  try {
    await OptimizedStudentController.search(req, res);
  } catch (error) {
    next(error);
  } finally {
    console.timeEnd('⚡ Student Search Route');
  }
});

router.get('/validation', async (req, res, next) => {
  console.time('⚡ Student Validation Route');
  try {
    await OptimizedStudentController.getAllForValidation(req, res);
  } catch (error) {
    next(error);
  } finally {
    console.timeEnd('⚡ Student Validation Route');
  }
});

router.get('/:id', async (req, res, next) => {
  console.time('⚡ Student Detail Route');
  try {
    await OptimizedStudentController.getById(req, res);
  } catch (error) {
    next(error);
  } finally {
    console.timeEnd('⚡ Student Detail Route');
  }
});

router.post('/', async (req, res, next) => {
  console.time('⚡ Student Creation Route');
  try {
    await OptimizedStudentController.create(req, res);
  } catch (error) {
    next(error);
  } finally {
    console.timeEnd('⚡ Student Creation Route');
  }
});

export default router; 