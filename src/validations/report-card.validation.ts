import { z } from 'zod';

export const studentIdParamsSchema = z.object({
  alumno_id: z.coerce.number().int().positive(),
});

export const signReportCardParamsSchema = z.object({
  alumno_id: z.coerce.number().int().positive(),
  periodo: z.enum([
    'primer trimestre',
    'segundo trimestre',
    'tercer trimestre',
  ]),
});

export const signReportCardBodySchema = z.object({}).strict().optional();
