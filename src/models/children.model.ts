import { query } from '../db/connection';
import type { ChildRow } from '../types/children.types';

export async function findChildrenByTutorId(
  tutorId: number,
): Promise<ChildRow[]> {
  const rows = await query(
    `SELECT
      a.id AS alumno_id,
      a.nombre,
      a.apellido,
      g.id AS grupo_id,
      CONCAT(g.grado, '° ', g.grupo_letra) AS grupo_nombre,
      g.grado,
      g.grupo_letra,
      g.ciclo_escolar,
      a.foto_url,
      ta.parentesco
    FROM tutor_alumno ta
    JOIN alumnos a ON a.id = ta.alumno_id
    JOIN grupos g ON g.id = a.grupo_id
    WHERE ta.tutor_id = $1
    ORDER BY a.apellido, a.nombre`,
    [tutorId],
  );
  return rows as ChildRow[];
}
