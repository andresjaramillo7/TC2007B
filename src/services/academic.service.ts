import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants';
import {
  findAssignmentsByTeacherId,
  findAllAssignments,
  findGroupById,
  teacherHasAccessToGroup,
  findStudentsByGroupId,
} from '../models/academic.model';
import type { Assignment, Student, GroupInfo, SubjectInfo } from '../types/academic.types';

function mapAssignmentRow(row: {
  asignacion_id: number;
  grupo_id: number;
  grupo_nombre: string;
  grado: number;
  grupo_letra: string;
  ciclo_escolar: string;
  materia_id: number;
  materia_nombre: string;
}): Assignment {
  return {
    asignacion_id: row.asignacion_id,
    grupo: {
      grupo_id: row.grupo_id,
      nombre: row.grupo_nombre,
      grado: row.grado,
      grupo_letra: row.grupo_letra,
      ciclo_escolar: row.ciclo_escolar,
    } satisfies GroupInfo,
    materia: {
      materia_id: row.materia_id,
      nombre: row.materia_nombre,
    } satisfies SubjectInfo,
  };
}

export async function getAssignmentsForUser(
  userId: number,
  role: string,
): Promise<Assignment[]> {
  const rows =
    role === 'admin'
      ? await findAllAssignments()
      : await findAssignmentsByTeacherId(userId);

  return rows.map(mapAssignmentRow);
}

export async function getStudentsForAuthorizedGroup(
  userId: number,
  role: string,
  groupId: number,
): Promise<Student[]> {
  if (role === 'docente') {
    const hasAccess = await teacherHasAccessToGroup(userId, groupId);
    if (!hasAccess) {
      throw new AppError('Group not found', HTTP_STATUS.NOT_FOUND);
    }
  } else {
    const group = await findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', HTTP_STATUS.NOT_FOUND);
    }
  }

  const rows = await findStudentsByGroupId(groupId);
  return rows.map((row) => ({
    alumno_id: row.alumno_id,
    nombre: row.nombre,
    apellido: row.apellido,
    foto_url: row.foto_url,
  }));
}
