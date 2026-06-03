import { z } from 'zod';

export const chatIdParamsSchema = z.object({
  chat_id: z.coerce.number().int().positive(),
});

export const messagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const sendMessageBodySchema = z.object({
  contenido: z.string().trim().min(1).max(2000),
});
