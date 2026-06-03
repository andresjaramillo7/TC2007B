import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants';
import {
  findChildByTutorAndStudentId,
  findConsolidatedGradesByStudentAndGroupId,
} from '../models/report-card.model';
import type {
  ReportCardData,
  ReportCardAlumno,
  ReportCardSubjectEntry,
  ReportCardSubject,
  ReportCardDocente,
  ReportCardGrade,
  ReportCardGroup,
  ChildRow,
} from '../types/report-card.types';

function mapAlumno(child: ChildRow): ReportCardAlumno {
  return {
    alumno_id: child.alumno_id,
    nombre: child.nombre,
    apellido: child.apellido,
    nombre_completo: `${child.nombre} ${child.apellido}`,
    grupo: {
      grupo_id: child.grupo_id,
      nombre: child.grupo_nombre,
      grado: child.grado,
      grupo_letra: child.grupo_letra,
      ciclo_escolar: child.ciclo_escolar,
    } satisfies ReportCardGroup,
    foto_url: child.foto_url,
  };
}

export async function getConsolidatedReportCard(
  tutorId: number,
  studentId: number,
): Promise<ReportCardData> {
  const child = await findChildByTutorAndStudentId(tutorId, studentId);
  if (!child) {
    throw new AppError('Student not found', HTTP_STATUS.NOT_FOUND);
  }

  const rows = await findConsolidatedGradesByStudentAndGroupId(
    studentId,
    child.grupo_id,
  );

  const grouped = new Map<number, ReportCardSubjectEntry>();

  for (const row of rows) {
    if (!grouped.has(row.asignacion_id)) {
      grouped.set(row.asignacion_id, {
        asignacion_id: row.asignacion_id,
        materia: {
          materia_id: row.materia_id,
          nombre: row.nombre_materia,
        } satisfies ReportCardSubject,
        docente: {
          docente_id: row.docente_id,
          nombre: row.docente_nombre,
          apellido: row.docente_apellido,
        } satisfies ReportCardDocente,
        calificaciones: [],
      });
    }

    const entry = grouped.get(row.asignacion_id)!;
    entry.calificaciones.push({
      periodo: row.periodo,
      nota: row.calificacion === null ? null : Number(row.calificacion),
      comentario: row.comentario,
      fecha_registro: row.fecha_registro,
    } satisfies ReportCardGrade);
  }

  const boleta = Array.from(grouped.values());

  return {
    alumno: mapAlumno(child),
    boleta,
  };
}
