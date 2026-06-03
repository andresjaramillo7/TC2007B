import { Router } from 'express';
import { getChildrenHandler } from '../controllers/children.controller';
import { getChildReportCardHandler } from '../controllers/report-card.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { validateRequest } from '../middlewares/validateRequest';
import { studentIdParamsSchema } from '../validations/report-card.validation';

const router = Router();

router.get(
  '/hijos',
  authenticate,
  authorizeRoles('tutor'),
  getChildrenHandler,
);

router.get(
  '/hijos/:alumno_id/calificaciones',
  authenticate,
  authorizeRoles('tutor'),
  validateRequest({ params: studentIdParamsSchema }),
  getChildReportCardHandler,
);

export default router;
