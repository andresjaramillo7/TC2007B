import { query } from '../db/connection';
import type { PoolClient } from 'pg';

export interface AssignmentInfo {
  id: number;
  docente_id: number;
  grupo_id: number;
  materia_id: number;
}

export interface StudentInfo {
  id: number;
  nombre: string;
  apellido: string;
  grupo_id: number;
  foto_url: string | null;
}

export async function findAssignmentById(
  asignacionId: number,
): Promise<AssignmentInfo | null> {
  const rows = await query(
    'SELECT id, docente_id, grupo_id, materia_id FROM asignaciones_docentes WHERE id = $1',
    [asignacionId],
  );
  return rows.length > 0 ? (rows[0] as AssignmentInfo) : null;
}

export async function teacherOwnsAssignment(
  teacherId: number,
  asignacionId: number,
): Promise<boolean> {
  const rows = await query(
    'SELECT 1 FROM asignaciones_docentes WHERE id = $1 AND docente_id = $2 LIMIT 1',
    [asignacionId, teacherId],
  );
  return rows.length > 0;
}

export async function findStudentById(
  alumnoId: number,
): Promise<StudentInfo | null> {
  const rows = await query(
    'SELECT id, nombre, apellido, grupo_id, foto_url FROM alumnos WHERE id = $1',
    [alumnoId],
  );
  return rows.length > 0 ? (rows[0] as StudentInfo) : null;
}

export async function teacherHasStudentInAssignment(
  teacherId: number,
  alumnoId: number,
): Promise<boolean> {
  const rows = await query(
    `SELECT 1
     FROM alumnos a
     JOIN asignaciones_docentes ad ON ad.grupo_id = a.grupo_id
     WHERE a.id = $1 AND ad.docente_id = $2
     LIMIT 1`,
    [alumnoId, teacherId],
  );
  return rows.length > 0;
}

export async function studentBelongsToAssignmentGroup(
  alumnoId: number,
  asignacionId: number,
): Promise<boolean> {
  const rows = await query(
    `SELECT 1
     FROM alumnos a
     JOIN asignaciones_docentes ad ON a.grupo_id = ad.grupo_id
     WHERE a.id = $1 AND ad.id = $2
     LIMIT 1`,
    [alumnoId, asignacionId],
  );
  return rows.length > 0;
}

export async function findGradesForStudent(
  alumnoId: number,
  teacherId?: number,
): Promise<Record<string, unknown>[]> {
  const rows = await query(
    `SELECT
       c.id AS calificacion_id,
       c.asignacion_docente_id AS asignacion_id,
       m.nombre_materia AS materia,
       c.periodo,
       c.calificacion,
       c.comentario,
       c.fecha_registro
     FROM calificaciones c
     JOIN asignaciones_docentes ad ON c.asignacion_docente_id = ad.id
     JOIN materias m ON ad.materia_id = m.id
     WHERE c.alumno_id = $1
       AND ($2::int IS NULL OR ad.docente_id = $2)
     ORDER BY c.fecha_registro DESC`,
    [alumnoId, teacherId ?? null],
  );
  return rows;
}

export async function findGradeTable(
  asignacionId: number,
  periodo: string,
): Promise<Record<string, unknown>[]> {
  const rows = await query(
    `SELECT
       a.id AS alumno_id,
       a.nombre,
       a.apellido,
       a.foto_url,
       c.id AS calificacion_id,
       c.calificacion,
       c.comentario,
       c.fecha_registro
     FROM alumnos a
     JOIN asignaciones_docentes ad ON a.grupo_id = ad.grupo_id
     LEFT JOIN calificaciones c
       ON c.alumno_id = a.id
       AND c.asignacion_docente_id = ad.id
       AND c.periodo = $2
     WHERE ad.id = $1
     ORDER BY a.apellido, a.nombre`,
    [asignacionId, periodo],
  );
  return rows;
}

export async function upsertGrade(
  alumnoId: number,
  asignacionId: number,
  periodo: string,
  nota: number,
  comentario: string | null,
): Promise<number> {
  const rows = await query(
    `INSERT INTO calificaciones (alumno_id, asignacion_docente_id, periodo, calificacion, comentario)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (alumno_id, asignacion_docente_id, periodo)
     DO UPDATE SET
       calificacion = EXCLUDED.calificacion,
       comentario = EXCLUDED.comentario,
       fecha_registro = CURRENT_TIMESTAMP
     RETURNING id`,
    [alumnoId, asignacionId, periodo, nota, comentario],
  );
  return (rows[0] as { id: number }).id;
}

export async function validateStudentsBelongToAssignment(
  client: PoolClient,
  alumnoIds: number[],
  asignacionId: number,
): Promise<boolean> {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM alumnos
     WHERE id = ANY($1::int[])
       AND grupo_id = (SELECT grupo_id FROM asignaciones_docentes WHERE id = $2)`,
    [alumnoIds, asignacionId],
  );
  return (result.rows[0] as { count: number }).count === alumnoIds.length;
}

export async function upsertGradesBulkTransaction(
  client: PoolClient,
  calificaciones: { alumno_id: number; nota: number; comentario: string | null }[],
  asignacionId: number,
  periodo: string,
): Promise<number> {
  let count = 0;
  for (const item of calificaciones) {
    const result = await client.query(
      `INSERT INTO calificaciones (alumno_id, asignacion_docente_id, periodo, calificacion, comentario)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (alumno_id, asignacion_docente_id, periodo)
       DO UPDATE SET
         calificacion = EXCLUDED.calificacion,
         comentario = EXCLUDED.comentario,
         fecha_registro = CURRENT_TIMESTAMP`,
      [item.alumno_id, asignacionId, periodo, item.nota, item.comentario],
    );
    count += result.rowCount ?? 0;
  }
  return count;
}
