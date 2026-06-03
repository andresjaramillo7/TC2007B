import { query } from '../db/connection';
import type { ChildRow, GradeRow } from '../types/report-card.types';

export async function findChildByTutorAndStudentId(
  tutorId: number,
  studentId: number,
): Promise<ChildRow | null> {
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
    WHERE ta.tutor_id = $1 AND a.id = $2`,
    [tutorId, studentId],
  );
  return rows.length > 0 ? (rows[0] as ChildRow) : null;
}

export async function findConsolidatedGradesByStudentAndGroupId(
  studentId: number,
  groupId: number,
): Promise<GradeRow[]> {
  const rows = await query(
    `SELECT
      ad.id AS asignacion_id,
      m.id AS materia_id,
      m.nombre_materia,
      u.id AS docente_id,
      u.nombre AS docente_nombre,
      u.apellido AS docente_apellido,
      p.periodo,
      c.calificacion,
      c.comentario,
      c.fecha_registro
    FROM asignaciones_docentes ad
    JOIN materias m ON m.id = ad.materia_id
    JOIN usuarios u ON u.id = ad.docente_id
    CROSS JOIN (
      VALUES
        ('primer trimestre'),
        ('segundo trimestre'),
        ('tercer trimestre')
    ) AS p(periodo)
    LEFT JOIN calificaciones c
      ON c.asignacion_docente_id = ad.id
      AND c.alumno_id = $1
      AND c.periodo = p.periodo
    WHERE ad.grupo_id = $2
    ORDER BY
      m.nombre_materia,
      u.apellido,
      u.nombre,
      CASE p.periodo
        WHEN 'primer trimestre' THEN 1
        WHEN 'segundo trimestre' THEN 2
        WHEN 'tercer trimestre' THEN 3
      END`,
    [studentId, groupId],
  );
  return rows as GradeRow[];
}
