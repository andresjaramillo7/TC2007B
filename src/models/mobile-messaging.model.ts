import { query } from '../db/connection';
import pool from '../db/connection';

export interface TutorInboxRawRow {
  chat_id: number;
  asignacion_id: number;
  alumno_id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  docente_id: number;
  docente_nombre: string;
  docente_apellido: string;
  materia_id: number;
  materia_nombre: string;
  ultimo_mensaje: string | null;
  ultima_fecha: string | null;
  no_leidos: number;
}

export async function findChatsByTutorId(
  tutorId: number,
): Promise<TutorInboxRawRow[]> {
  const rows = await query(
    `SELECT
       c.id AS chat_id,
       ad.id AS asignacion_id,
       a.id AS alumno_id,
       a.nombre AS alumno_nombre,
       a.apellido AS alumno_apellido,
       docente_u.id AS docente_id,
       docente_u.nombre AS docente_nombre,
       docente_u.apellido AS docente_apellido,
       m.id AS materia_id,
       m.nombre_materia AS materia_nombre,
       latest.contenido AS ultimo_mensaje,
       latest.fecha_envio AS ultima_fecha,
       COALESCE(unread.unread_count, 0) AS no_leidos
     FROM chats c
     JOIN alumnos a ON c.alumno_id = a.id
     JOIN asignaciones_docentes ad ON c.asignacion_docente_id = ad.id
     JOIN materias m ON ad.materia_id = m.id
     JOIN usuarios docente_u ON ad.docente_id = docente_u.id
     JOIN chat_participantes cp ON cp.chat_id = c.id AND cp.usuario_id = $1
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
     ORDER BY latest.fecha_envio DESC NULLS LAST, c.id DESC`,
    [tutorId],
  );
  return rows as TutorInboxRawRow[];
}

export interface LinkedStudentAssignment {
  alumno_id: number;
  docente_id: number;
  grupo_id: number;
}

export async function findLinkedStudentAssignmentForTutor(
  tutorId: number,
  alumnoId: number,
  asignacionId: number,
): Promise<LinkedStudentAssignment | null> {
  const rows = await query(
    `SELECT
       ta.alumno_id,
       ad.docente_id,
       a.grupo_id
     FROM tutor_alumno ta
     JOIN alumnos a ON a.id = ta.alumno_id
     JOIN asignaciones_docentes ad
       ON ad.id = $3
       AND ad.grupo_id = a.grupo_id
     WHERE ta.tutor_id = $1
       AND ta.alumno_id = $2`,
    [tutorId, alumnoId, asignacionId],
  );
  return rows.length > 0 ? (rows[0] as LinkedStudentAssignment) : null;
}

export interface CreateChatTransactionResult {
  chat_id: number;
  mensaje_id: number;
  chat_creado: boolean;
}

export async function createOrReuseChatTransaction(
  tutorId: number,
  alumnoId: number,
  asignacionDocenteId: number,
  docenteId: number,
  contenido: string,
): Promise<CreateChatTransactionResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let chatId: number;
    let chatCreado = false;

    const insertResult = await client.query(
      `INSERT INTO chats (alumno_id, asignacion_docente_id)
       VALUES ($1, $2)
       ON CONFLICT (alumno_id, asignacion_docente_id) DO NOTHING
       RETURNING id`,
      [alumnoId, asignacionDocenteId],
    );

    if (insertResult.rows.length > 0) {
      chatId = insertResult.rows[0].id;
      chatCreado = true;
    } else {
      const existing = await client.query(
        `SELECT id FROM chats
         WHERE alumno_id = $1 AND asignacion_docente_id = $2`,
        [alumnoId, asignacionDocenteId],
      );
      chatId = existing.rows[0].id;
    }

    await client.query(
      `INSERT INTO chat_participantes (chat_id, usuario_id)
       VALUES ($1, $2)
       ON CONFLICT (chat_id, usuario_id) DO NOTHING`,
      [chatId, tutorId],
    );

    await client.query(
      `INSERT INTO chat_participantes (chat_id, usuario_id)
       VALUES ($1, $2)
       ON CONFLICT (chat_id, usuario_id) DO NOTHING`,
      [chatId, docenteId],
    );

    const msgResult = await client.query(
      `INSERT INTO mensajes (chat_id, remitente_id, contenido, leido)
       VALUES ($1, $2, $3, false)
       RETURNING id`,
      [chatId, tutorId, contenido],
    );

    await client.query('COMMIT');

    return {
      chat_id: chatId,
      mensaje_id: msgResult.rows[0].id,
      chat_creado: chatCreado,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
