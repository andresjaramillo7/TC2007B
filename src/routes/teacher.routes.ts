import { Router } from 'express';
import {
  getAssignmentsHandler,
  getStudentsByGroupHandler,
} from '../controllers/academic.controller';
import {
  getStudentGradesHandler,
  getAssignmentGradesHandler,
  upsertGradeHandler,
  upsertBulkGradesHandler,
} from '../controllers/grades.controller';
import {
  getChatsHandler,
  getMessagesHandler,
  sendMessageHandler,
} from '../controllers/messaging.controller';
import {
  getAnnouncementsHandler,
  publishAnnouncementHandler,
} from '../controllers/announcements.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { validateRequest } from '../middlewares/validateRequest';
import { groupIdParamsSchema } from '../validations/academic.validation';
import {
  alumnoIdParamsSchema,
  asignacionIdParamsSchema,
  periodoQuerySchema,
  upsertGradeBodySchema,
  bulkUpsertGradeBodySchema,
} from '../validations/grades.validation';
import {
  chatIdParamsSchema,
  messagesQuerySchema,
  sendMessageBodySchema,
} from '../validations/messaging.validation';
import { publishAnnouncementBodySchema } from '../validations/announcements.validation';

const router = Router();

router.get(
  '/avisos',
  authenticate,
  authorizeRoles('docente', 'admin'),
  getAnnouncementsHandler,
);

router.post(
  '/avisos',
  authenticate,
  authorizeRoles('docente', 'admin'),
  validateRequest({ body: publishAnnouncementBodySchema }),
  publishAnnouncementHandler,
);

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

router.get(
  '/alumnos/:alumno_id/calificaciones',
  authenticate,
  authorizeRoles('docente', 'admin'),
  validateRequest({ params: alumnoIdParamsSchema }),
  getStudentGradesHandler,
);

router.get(
  '/asignaciones/:asignacion_id/calificaciones',
  authenticate,
  authorizeRoles('docente', 'admin'),
  validateRequest({
    params: asignacionIdParamsSchema,
    query: periodoQuerySchema,
  }),
  getAssignmentGradesHandler,
);

router.post(
  '/calificaciones',
  authenticate,
  authorizeRoles('docente', 'admin'),
  validateRequest({ body: upsertGradeBodySchema }),
  upsertGradeHandler,
);

router.post(
  '/calificaciones/bulk',
  authenticate,
  authorizeRoles('docente', 'admin'),
  validateRequest({ body: bulkUpsertGradeBodySchema }),
  upsertBulkGradesHandler,
);

router.get(
  '/chats',
  authenticate,
  authorizeRoles('docente', 'admin'),
  getChatsHandler,
);

router.get(
  '/chats/:chat_id/mensajes',
  authenticate,
  authorizeRoles('docente', 'admin'),
  validateRequest({ params: chatIdParamsSchema, query: messagesQuerySchema }),
  getMessagesHandler,
);

router.post(
  '/chats/:chat_id/mensajes',
  authenticate,
  authorizeRoles('docente', 'admin'),
  validateRequest({ params: chatIdParamsSchema, body: sendMessageBodySchema }),
  sendMessageHandler,
);

export default router;
