import { Router } from 'express';
import {
  getAssignmentsHandler,
  getStudentsByGroupHandler,
} from '../controllers/academic.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { validateRequest } from '../middlewares/validateRequest';
import { groupIdParamsSchema } from '../validations/academic.validation';

const router = Router();

router.get(
  '/asignaciones',
  authenticate,
  authorizeRoles('docente', 'admin'),
  getAssignmentsHandler,
);

router.get(
  '/grupos/:grupo_id/alumnos',
  authenticate,
  authorizeRoles('docente', 'admin'),
  validateRequest({ params: groupIdParamsSchema }),
  getStudentsByGroupHandler,
);

export default router;
