import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants';
import type { Role } from '../constants';
import {
  findAnnouncementsBySenderId,
  findAllAnnouncements,
  insertAnnouncement,
} from '../models/announcements.model';
import {
  findGroupById,
  teacherHasAccessToGroup,
} from '../models/academic.model';
import { insertAuditLog } from '../models/audit-log.model';
import type {
  AnnouncementResponse,
  PublishAnnouncementInput,
  PublishAnnouncementResult,
  AnnouncementRow,
} from '../types/announcements.types';

function mapAnnouncementRow(row: AnnouncementRow): AnnouncementResponse {
  return {
    aviso_id: row.aviso_id,
    grupo: {
      grupo_id: row.grupo_id,
      nombre: row.grupo_nombre,
    },
    remitente: {
      usuario_id: row.remitente_usuario_id,
      nombre: row.remitente_nombre,
      apellido: row.remitente_apellido,
      rol: row.remitente_rol,
    },
    titulo: row.titulo,
    contenido: row.contenido,
    fecha_publicacion: row.fecha_publicacion,
  };
}

export async function getAnnouncementsForUser(
  userId: number,
  role: Role,
): Promise<AnnouncementResponse[]> {
  const rows =
    role === 'admin'
      ? await findAllAnnouncements()
      : await findAnnouncementsBySenderId(userId);
  return rows.map(mapAnnouncementRow);
}

export async function publishAnnouncement(
  userId: number,
  role: Role,
  input: PublishAnnouncementInput,
): Promise<PublishAnnouncementResult> {
  if (role === 'docente') {
    const hasAccess = await teacherHasAccessToGroup(userId, input.grupo_id);
    if (!hasAccess) {
      throw new AppError('Group not found', HTTP_STATUS.NOT_FOUND);
    }
  } else {
    const group = await findGroupById(input.grupo_id);
    if (!group) {
      throw new AppError('Group not found', HTTP_STATUS.NOT_FOUND);
    }
  }

  const avisoId = await insertAnnouncement(
    input.grupo_id,
    userId,
    input.titulo,
    input.contenido,
  );

  await insertAuditLog({
    usuarioId: userId,
    accion: 'ANNOUNCEMENT_CREATED',
    entidad: 'avisos_grupales',
    entidadId: avisoId,
    exitoso: true,
    detalles: { grupo_id: input.grupo_id },
  });

  return { message: 'Aviso publicado', aviso_id: avisoId };
}
