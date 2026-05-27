import { Router } from 'express';
import authRoutes from './auth.routes';
import mobileRoutes from './mobile.routes';
import teacherRoutes from './teacher.routes';

const router = Router();

router.use('/api/auth', authRoutes);
router.use('/api/mobile', mobileRoutes);
router.use('/api/teacher', teacherRoutes);

export default router;
