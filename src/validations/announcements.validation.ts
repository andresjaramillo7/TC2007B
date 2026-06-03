import { z } from 'zod';

export const publishAnnouncementBodySchema = z.object({
  grupo_id: z.number().int().positive(),
  titulo: z.string().trim().min(1).max(150),
  contenido: z.string().trim().min(1).max(3000),
});

export type PublishAnnouncementInput = z.infer<typeof publishAnnouncementBodySchema>;
