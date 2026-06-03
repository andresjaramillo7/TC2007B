import { Router } from 'express';
import { getChildrenHandler } from '../controllers/children.controller';
import { getMobileAnnouncementsHandler } from '../controllers/mobile-announcements.controller';
import {
  getChildReportCardHandler,
  signReportCardHandler,
  downloadReportCardPdfHandler,
} from '../controllers/report-card.controller';
import {
  getMobileChatsHandler,
  startMobileChatHandler,
  getMobileChatMessagesHandler,
  sendMobileChatMessageHandler,
} from '../controllers/mobile-messaging.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { validateRequest } from '../middlewares/validateRequest';
import {
  studentIdParamsSchema,
  signReportCardParamsSchema,
  signReportCardBodySchema,
} from '../validations/report-card.validation';
import {
  chatIdParamsSchema,
  messagesQuerySchema,
  sendMessageBodySchema,
  startChatBodySchema,
} from '../validations/mobile-messaging.validation';

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

router.get(
  '/avisos',
  authenticate,
  authorizeRoles('tutor'),
  getMobileAnnouncementsHandler,
);

router.get(
  '/chats',
  authenticate,
  authorizeRoles('tutor'),
  getMobileChatsHandler,
);

router.post(
  '/chats',
  authenticate,
  authorizeRoles('tutor'),
  validateRequest({ body: startChatBodySchema }),
  startMobileChatHandler,
);

router.get(
  '/chats/:chat_id/mensajes',
  authenticate,
  authorizeRoles('tutor'),
  validateRequest({ params: chatIdParamsSchema, query: messagesQuerySchema }),
  getMobileChatMessagesHandler,
);

router.post(
  '/chats/:chat_id/mensajes',
  authenticate,
  authorizeRoles('tutor'),
  validateRequest({ params: chatIdParamsSchema, body: sendMessageBodySchema }),
  sendMobileChatMessageHandler,
);

export default router;
