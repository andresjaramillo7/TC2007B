import { z } from "zod";

export const groupIdParamsSchema = z.object({
  grupo_id: z.coerce.number().int().positive(),
});
