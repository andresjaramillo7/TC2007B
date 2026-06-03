import { query } from '../db/connection';
import type { AnnouncementRow } from '../types/announcements.types';

export async function findAnnouncementsBySenderId(
  senderId: number,
): Promise<AnnouncementRow[]> {
  const rows = await query(
    `SELECT
       ag.id AS aviso_id,
       ag.grupo_id,
       CONCAT(g.grado, '° ', g.grupo_letra) AS grupo_nombre,
       u.id AS remitente_usuario_id,
       u.nombre AS remitente_nombre,
       u.apellido AS remitente_apellido,
       u.rol AS remitente_rol,
       ag.titulo,
       ag.contenido,
       ag.fecha_publicacion
     FROM avisos_grupales ag
     JOIN grupos g ON ag.grupo_id = g.id
     JOIN usuarios u ON ag.remitente_id = u.id
     WHERE ag.remitente_id = $1
     ORDER BY ag.fecha_publicacion DESC, ag.id DESC`,
    [senderId],
  );
  return rows as AnnouncementRow[];
}

export async function findAllAnnouncements(): Promise<AnnouncementRow[]> {
  const rows = await query(
    `SELECT
       ag.id AS aviso_id,
       ag.grupo_id,
       CONCAT(g.grado, '° ', g.grupo_letra) AS grupo_nombre,
       u.id AS remitente_usuario_id,
       u.nombre AS remitente_nombre,
       u.apellido AS remitente_apellido,
       u.rol AS remitente_rol,
       ag.titulo,
       ag.contenido,
       ag.fecha_publicacion
     FROM avisos_grupales ag
     JOIN grupos g ON ag.grupo_id = g.id
     JOIN usuarios u ON ag.remitente_id = u.id
     ORDER BY ag.fecha_publicacion DESC, ag.id DESC`,
  );
  return rows as AnnouncementRow[];
}

export async function insertAnnouncement(
  groupId: number,
  senderId: number,
  title: string,
  content: string,
): Promise<number> {
  const rows = await query(
    `INSERT INTO avisos_grupales (grupo_id, remitente_id, titulo, contenido)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [groupId, senderId, title, content],
  );
  return (rows[0] as { id: number }).id;
}
