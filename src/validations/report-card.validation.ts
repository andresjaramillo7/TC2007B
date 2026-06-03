import { z } from 'zod';

export const studentIdParamsSchema = z.object({
  alumno_id: z.coerce.number().int().positive(),
});
