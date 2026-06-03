import { query } from '../db/connection';

export interface AssignmentRow {
  asignacion_id: number;
  grupo_id: number;
  grupo_nombre: string;
  grado: number;
  grupo_letra: string;
  ciclo_escolar: string;
  materia_id: number;
  materia_nombre: string;
}

export interface GroupRow {
  id: number;
  grado: number;
  grupo_letra: string;
  ciclo_escolar: string;
}

export interface StudentRow {
  alumno_id: number;
  nombre: string;
  apellido: string;
  foto_url: string | null;
}

export async function findAssignmentsByTeacherId(
  teacherId: number,
): Promise<AssignmentRow[]> {
  const rows = await query(
    `SELECT
      ad.id AS asignacion_id,
      g.id AS grupo_id,
      CONCAT(g.grado, '° ', g.grupo_letra) AS grupo_nombre,
      g.grado,
      g.grupo_letra,
      g.ciclo_escolar,
      m.id AS materia_id,
      m.nombre_materia AS materia_nombre
    FROM asignaciones_docentes ad
    JOIN grupos g ON ad.grupo_id = g.id
    JOIN materias m ON ad.materia_id = m.id
    WHERE ad.docente_id = $1
    ORDER BY g.grado, g.grupo_letra, m.nombre_materia`,
    [teacherId],
  );
  return rows as AssignmentRow[];
}

export async function findAllAssignments(): Promise<AssignmentRow[]> {
  const rows = await query(
    `SELECT
      ad.id AS asignacion_id,
      g.id AS grupo_id,
      CONCAT(g.grado, '° ', g.grupo_letra) AS grupo_nombre,
      g.grado,
      g.grupo_letra,
      g.ciclo_escolar,
      m.id AS materia_id,
      m.nombre_materia AS materia_nombre
    FROM asignaciones_docentes ad
    JOIN grupos g ON ad.grupo_id = g.id
    JOIN materias m ON ad.materia_id = m.id
    ORDER BY g.grado, g.grupo_letra, m.nombre_materia`,
  );
  return rows as AssignmentRow[];
}

export async function findGroupById(
  groupId: number,
): Promise<GroupRow | null> {
  const rows = await query('SELECT * FROM grupos WHERE id = $1', [groupId]);
  return rows.length > 0 ? (rows[0] as GroupRow) : null;
}

export async function teacherHasAccessToGroup(
  teacherId: number,
  groupId: number,
): Promise<boolean> {
  const rows = await query(
    'SELECT 1 FROM asignaciones_docentes WHERE docente_id = $1 AND grupo_id = $2 LIMIT 1',
    [teacherId, groupId],
  );
  return rows.length > 0;
}

export async function findStudentsByGroupId(
  groupId: number,
): Promise<StudentRow[]> {
  const rows = await query(
    `SELECT
      id AS alumno_id,
      nombre,
      apellido,
      foto_url
    FROM alumnos
    WHERE grupo_id = $1
    ORDER BY apellido, nombre`,
    [groupId],
  );
  return rows as StudentRow[];
}
