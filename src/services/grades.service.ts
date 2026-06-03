import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants';
import pool from '../db/connection';
import {
  findAssignmentById,
  teacherOwnsAssignment,
  findStudentById,
  teacherHasStudentInAssignment,
  studentBelongsToAssignmentGroup,
  findGradesForStudent as modelFindGradesForStudent,
  findGradeTable as modelFindGradeTable,
  upsertGrade as modelUpsertGrade,
  validateStudentsBelongToAssignment,
  upsertGradesBulkTransaction,
} from '../models/grades.model';
import type { GradeRow, GradeTableEntry, UpsertGradeInput } from '../types/grades.types';

function convertGradeRow(row: Record<string, unknown>): GradeRow {
  return {
    calificacion_id: row.calificacion_id as number,
    asignacion_id: row.asignacion_id as number,
    materia: row.materia as string,
    periodo: row.periodo as string,
    nota: Number(row.calificacion),
    comentario: (row.comentario as string) ?? null,
    fecha_registro: row.fecha_registro as string,
  };
}

function convertGradeTableRow(row: Record<string, unknown>): GradeTableEntry {
  const entry: GradeTableEntry = {
    alumno: {
      alumno_id: row.alumno_id as number,
      nombre: row.nombre as string,
      apellido: row.apellido as string,
      foto_url: (row.foto_url as string) ?? null,
    },
    calificacion: null,
  };

  if (row.calificacion_id) {
    entry.calificacion = {
      calificacion_id: row.calificacion_id as number,
      nota: Number(row.calificacion),
      comentario: (row.comentario as string) ?? null,
      fecha_registro: row.fecha_registro as string,
    };
  }

  return entry;
}

export async function getStudentGradeHistory(
  userId: number,
  role: string,
  alumnoId: number,
): Promise<GradeRow[]> {
  const student = await findStudentById(alumnoId);
  if (!student) {
    throw new AppError('Student not found', HTTP_STATUS.NOT_FOUND);
  }

  if (role === 'docente') {
    const hasRelationship = await teacherHasStudentInAssignment(userId, alumnoId);
    if (!hasRelationship) {
      throw new AppError('Student not found', HTTP_STATUS.NOT_FOUND);
    }
    const rows = await modelFindGradesForStudent(alumnoId, userId);
    return rows.map(convertGradeRow);
  }

  const rows = await modelFindGradesForStudent(alumnoId);
  return rows.map(convertGradeRow);
}

export async function getAssignmentGradeTable(
  userId: number,
  role: string,
  asignacionId: number,
  periodo: string,
): Promise<GradeTableEntry[]> {
  const assignment = await findAssignmentById(asignacionId);
  if (!assignment) {
    throw new AppError('Assignment not found', HTTP_STATUS.NOT_FOUND);
  }

  if (role === 'docente') {
    const owns = await teacherOwnsAssignment(userId, asignacionId);
    if (!owns) {
      throw new AppError('Assignment not found', HTTP_STATUS.NOT_FOUND);
    }
  }

  const rows = await modelFindGradeTable(asignacionId, periodo);
  return rows.map(convertGradeTableRow);
}

export async function upsertSingleGrade(
  userId: number,
  role: string,
  data: UpsertGradeInput,
): Promise<{ message: string; calificacion_id: number }> {
  const assignment = await findAssignmentById(data.asignacion_id);
  if (!assignment) {
    throw new AppError('Assignment not found', HTTP_STATUS.NOT_FOUND);
  }

  if (role === 'docente') {
    const owns = await teacherOwnsAssignment(userId, data.asignacion_id);
    if (!owns) {
      throw new AppError('Assignment not found', HTTP_STATUS.NOT_FOUND);
    }
  }

  const belongs = await studentBelongsToAssignmentGroup(
    data.alumno_id,
    data.asignacion_id,
  );
  if (!belongs) {
    throw new AppError('Student not found', HTTP_STATUS.NOT_FOUND);
  }

  const calificacionId = await modelUpsertGrade(
    data.alumno_id,
    data.asignacion_id,
    data.periodo,
    data.nota,
    data.comentario ?? null,
  );

  return {
    message: 'Calificación registrada con éxito',
    calificacion_id: calificacionId,
  };
}

export async function upsertBulkGrades(
  userId: number,
  role: string,
  data: {
    asignacion_id: number;
    periodo: string;
    calificaciones: { alumno_id: number; nota: number; comentario: string | null }[];
  },
): Promise<{ message: string; actualizadas: number }> {
  const assignment = await findAssignmentById(data.asignacion_id);
  if (!assignment) {
    throw new AppError('Assignment not found', HTTP_STATUS.NOT_FOUND);
  }

  if (role === 'docente') {
    const owns = await teacherOwnsAssignment(userId, data.asignacion_id);
    if (!owns) {
      throw new AppError('Assignment not found', HTTP_STATUS.NOT_FOUND);
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const alumnoIds = data.calificaciones.map((c) => c.alumno_id);
    const allBelong = await validateStudentsBelongToAssignment(
      client,
      alumnoIds,
      data.asignacion_id,
    );
    if (!allBelong) {
      await client.query('ROLLBACK');
      throw new AppError('Student not found', HTTP_STATUS.NOT_FOUND);
    }

    const count = await upsertGradesBulkTransaction(
      client,
      data.calificaciones,
      data.asignacion_id,
      data.periodo,
    );

    await client.query('COMMIT');

    return {
      message: 'Calificaciones registradas con éxito',
      actualizadas: count,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
