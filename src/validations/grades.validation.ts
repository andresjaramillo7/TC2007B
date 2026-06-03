import { z } from 'zod';

const periodoEnum = z.enum([
  'primer trimestre',
  'segundo trimestre',
  'tercer trimestre',
]);

export const periodoEnumSchema = periodoEnum;

export const alumnoIdParamsSchema = z.object({
  alumno_id: z.coerce.number().int().positive(),
});

export const asignacionIdParamsSchema = z.object({
  asignacion_id: z.coerce.number().int().positive(),
});

export const periodoQuerySchema = z.object({
  periodo: periodoEnum,
});

export const upsertGradeBodySchema = z.object({
  alumno_id: z.number().int().positive(),
  asignacion_id: z.number().int().positive(),
  periodo: periodoEnum,
  nota: z.number().min(0).max(10),
  comentario: z.string().max(500).nullable().optional(),
});

const bulkGradeItemSchema = z.object({
  alumno_id: z.number().int().positive(),
  nota: z.number().min(0).max(10),
  comentario: z.string().max(500).nullable().optional(),
});

export const bulkUpsertGradeBodySchema = z.object({
  asignacion_id: z.number().int().positive(),
  periodo: periodoEnum,
  calificaciones: z
    .array(bulkGradeItemSchema)
    .min(1, 'At least one grade is required')
    .max(100, 'Maximum 100 grades allowed')
    .refine(
      (items) => {
        const ids = items.map((i) => i.alumno_id);
        return new Set(ids).size === ids.length;
      },
      { message: 'Duplicate alumno_id values are not allowed' },
    ),
});
