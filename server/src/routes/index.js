import { Router } from 'express';
import authRoutes from './authRoutes.js';
import courseRoutes from './courseRoutes.js';
import postRoutes from './postRoutes.js';
import enrollmentRoutes from './enrollmentRoutes.js';
import adminRoutes from './adminRoutes.js';
import { notFoundHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/posts', postRoutes);
router.use('/enroll', enrollmentRoutes);
router.use('/admin', adminRoutes);

// 404 handler for undefined routes
router.use(notFoundHandler);

export default router;