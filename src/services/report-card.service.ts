import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants';
import {
  findChildByTutorAndStudentId,
  findConsolidatedGradesByStudentAndGroupId,
  findSignaturesByTutorAndStudentId,
  upsertReportCardSignature,
  countGradesForStudentAndPeriod,
} from '../models/report-card.model';
import type {
  ReportCardData,
  ReportCardAlumno,
  ReportCardSubjectEntry,
  ReportCardSubject,
  ReportCardDocente,
  ReportCardGrade,
  ReportCardGroup,
  ReportCardFirmaSlot,
  ChildRow,
  SignatureRow,
} from '../types/report-card.types';

const TRIMESTERS = [
  'primer trimestre',
  'segundo trimestre',
  'tercer trimestre',
] as const;

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

function buildFirmaSlots(signatures: SignatureRow[]): ReportCardFirmaSlot[] {
  const sigMap = new Map<string, SignatureRow>();
  for (const sig of signatures) {
    sigMap.set(sig.periodo, sig);
  }

  return TRIMESTERS.map((periodo) => {
    const sig = sigMap.get(periodo);
    return {
      periodo,
      firmada: sig !== undefined,
      firma_id: sig ? sig.firma_id : null,
      comentario: sig ? sig.comentario : null,
      fecha_firma: sig ? sig.fecha_firma : null,
    };
  });
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
  const signatures = await findSignaturesByTutorAndStudentId(tutorId, studentId);
  const firmas = buildFirmaSlots(signatures);

  return {
    alumno: mapAlumno(child),
    boleta,
    firmas,
  };
}

export async function signReportCard(
  tutorId: number,
  studentId: number,
  periodo: string,
  comentario?: string | null,
): Promise<{ message: string; firma: SignatureRow }> {
  const child = await findChildByTutorAndStudentId(tutorId, studentId);
  if (!child) {
    throw new AppError('Student not found', HTTP_STATUS.NOT_FOUND);
  }

  const gradeCount = await countGradesForStudentAndPeriod(studentId, periodo);
  if (gradeCount === 0) {
    throw new AppError('Report card has no grades for this period', HTTP_STATUS.BAD_REQUEST);
  }

  const normalizedComentario = comentario === undefined ? null : comentario;

  const firma = await upsertReportCardSignature(
    tutorId,
    studentId,
    periodo,
    normalizedComentario,
  );

  return {
    message: 'Boleta firmada con éxito',
    firma,
  };
}
