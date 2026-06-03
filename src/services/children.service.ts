import { findChildrenByTutorId } from '../models/children.model';
import type {
  LinkedChild,
  LinkedChildGroup,
  ChildRow,
} from '../types/children.types';

function mapChildRow(child: ChildRow): LinkedChild {
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
    } satisfies LinkedChildGroup,
    foto_url: child.foto_url,
    parentesco: child.parentesco,
  };
}

export async function getChildrenForTutor(
  tutorId: number,
): Promise<LinkedChild[]> {
  const children = await findChildrenByTutorId(tutorId);
  return children.map(mapChildRow);
}
