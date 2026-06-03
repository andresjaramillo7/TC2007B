import { Router } from 'express';
import { getChildrenHandler } from '../controllers/children.controller';
import {
  getChildReportCardHandler,
  signReportCardHandler,
  downloadReportCardPdfHandler,
} from '../controllers/report-card.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { validateRequest } from '../middlewares/validateRequest';
import {
  studentIdParamsSchema,
  signReportCardParamsSchema,
  signReportCardBodySchema,
} from '../validations/report-card.validation';

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

router.post(
  '/hijos/:alumno_id/boletas/:periodo/firma',
  authenticate,
  authorizeRoles('tutor'),
  validateRequest({ params: signReportCardParamsSchema, body: signReportCardBodySchema }),
  signReportCardHandler,
);

router.get(
  '/hijos/:alumno_id/calificaciones/pdf',
  authenticate,
  authorizeRoles('tutor'),
  validateRequest({ params: studentIdParamsSchema }),
  downloadReportCardPdfHandler,
);

export default router;
