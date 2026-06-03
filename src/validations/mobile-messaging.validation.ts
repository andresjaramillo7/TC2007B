import { z } from 'zod';

export {
  chatIdParamsSchema,
  messagesQuerySchema,
  sendMessageBodySchema,
} from './messaging.validation';

export const startChatBodySchema = z.object({
  alumno_id: z.number().int().positive(),
  asignacion_id: z.number().int().positive(),
  contenido: z.string().trim().min(1).max(2000),
});
