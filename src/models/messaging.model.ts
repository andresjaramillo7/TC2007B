import { query } from '../db/connection';

export interface InboxRawRow {
  chat_id: number;
  tutor_id: number;
  tutor_nombre: string;
  tutor_apellido: string;
  alumno_id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  ultimo_mensaje: string | null;
  ultima_fecha: string | null;
  no_leidos: number;
}

export async function findChatsByParticipantId(userId: number): Promise<InboxRawRow[]> {
  const rows = await query(
    `SELECT
       c.id AS chat_id,
       u.id AS tutor_id,
       u.nombre AS tutor_nombre,
       u.apellido AS tutor_apellido,
       a.id AS alumno_id,
       a.nombre AS alumno_nombre,
       a.apellido AS alumno_apellido,
       latest.contenido AS ultimo_mensaje,
       latest.fecha_envio AS ultima_fecha,
       COALESCE(unread.unread_count, 0) AS no_leidos
     FROM chats c
     JOIN alumnos a ON c.alumno_id = a.id
     JOIN chat_participantes cp_tutor ON cp_tutor.chat_id = c.id
     JOIN usuarios u ON cp_tutor.usuario_id = u.id AND u.rol = 'tutor'
     JOIN tutor_alumno ta ON ta.alumno_id = a.id AND ta.tutor_id = u.id
     LEFT JOIN LATERAL (
       SELECT contenido, fecha_envio
       FROM mensajes
       WHERE chat_id = c.id
       ORDER BY fecha_envio DESC, id DESC
       LIMIT 1
     ) latest ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS unread_count
       FROM mensajes
       WHERE chat_id = c.id AND leido = false AND remitente_id != $1
     ) unread ON true
     WHERE c.id IN (
       SELECT chat_id FROM chat_participantes WHERE usuario_id = $1
     )
     ORDER BY latest.fecha_envio DESC NULLS LAST, c.id DESC`,
    [userId],
  );
  return rows as InboxRawRow[];
}

export async function findAllChats(): Promise<InboxRawRow[]> {
  const rows = await query(
    `SELECT
       c.id AS chat_id,
       u.id AS tutor_id,
       u.nombre AS tutor_nombre,
       u.apellido AS tutor_apellido,
       a.id AS alumno_id,
       a.nombre AS alumno_nombre,
       a.apellido AS alumno_apellido,
       latest.contenido AS ultimo_mensaje,
       latest.fecha_envio AS ultima_fecha,
       0 AS no_leidos
     FROM chats c
     JOIN alumnos a ON c.alumno_id = a.id
     JOIN chat_participantes cp_tutor ON cp_tutor.chat_id = c.id
     JOIN usuarios u ON cp_tutor.usuario_id = u.id AND u.rol = 'tutor'
     JOIN tutor_alumno ta ON ta.alumno_id = a.id AND ta.tutor_id = u.id
     LEFT JOIN LATERAL (
       SELECT contenido, fecha_envio
       FROM mensajes
       WHERE chat_id = c.id
       ORDER BY fecha_envio DESC, id DESC
       LIMIT 1
     ) latest ON true
     ORDER BY latest.fecha_envio DESC NULLS LAST, c.id DESC`,
  );
  return rows as InboxRawRow[];
}

export async function findChatById(chatId: number): Promise<{ id: number } | null> {
  const rows = await query('SELECT id FROM chats WHERE id = $1', [chatId]);
  return rows.length > 0 ? (rows[0] as { id: number }) : null;
}

export async function userParticipatesInChat(
  userId: number,
  chatId: number,
): Promise<boolean> {
  const rows = await query(
    'SELECT 1 FROM chat_participantes WHERE chat_id = $1 AND usuario_id = $2 LIMIT 1',
    [chatId, userId],
  );
  return rows.length > 0;
}

export async function findMessagesByChatId(
  chatId: number,
  offset: number,
  limit: number,
): Promise<Record<string, unknown>[]> {
  const rows = await query(
    `SELECT
       id AS mensaje_id,
       remitente_id,
       contenido,
       leido,
       fecha_envio
     FROM mensajes
     WHERE chat_id = $1
     ORDER BY fecha_envio DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [chatId, limit, offset],
  );
  return rows;
}

export async function countMessagesByChatId(chatId: number): Promise<number> {
  const rows = await query(
    'SELECT COUNT(*)::int AS count FROM mensajes WHERE chat_id = $1',
    [chatId],
  );
  return (rows[0] as { count: number }).count;
}

export async function markIncomingMessagesAsRead(
  chatId: number,
  readerId: number,
): Promise<void> {
  await query(
    `UPDATE mensajes
     SET leido = true
     WHERE chat_id = $1 AND remitente_id != $2 AND leido = false`,
    [chatId, readerId],
  );
}

export async function insertMessage(
  chatId: number,
  senderId: number,
  contenido: string,
): Promise<Record<string, unknown>> {
  const rows = await query(
    `INSERT INTO mensajes (chat_id, remitente_id, contenido, leido)
     VALUES ($1, $2, $3, false)
     RETURNING id AS mensaje_id, remitente_id, contenido, leido, fecha_envio`,
    [chatId, senderId, contenido],
  );
  return rows[0];
}
