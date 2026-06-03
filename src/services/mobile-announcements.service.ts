import { findAnnouncementsByTutorId } from '../models/mobile-announcements.model';
import type {
  MobileAnnouncementRow,
  MobileAnnouncementResponse,
} from '../types/mobile-announcements.types';

function mapToResponse(row: MobileAnnouncementRow): MobileAnnouncementResponse {
  return {
    aviso_id: row.aviso_id,
    grupo: {
      grupo_id: row.grupo_id,
      nombre: row.grupo_nombre,
    },
    autor: {
      usuario_id: row.autor_usuario_id,
      nombre: row.autor_nombre,
      apellido: row.autor_apellido,
      rol: row.autor_rol,
    },
    titulo: row.titulo,
    contenido: row.contenido,
    fecha_publicacion: row.fecha_publicacion,
  };
}

export async function getAnnouncementsForTutor(
  tutorId: number,
): Promise<MobileAnnouncementResponse[]> {
  const rows = await findAnnouncementsByTutorId(tutorId);
  return rows.map(mapToResponse);
}
