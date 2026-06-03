import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants';
import {
  findChatsByTutorId,
  findLinkedStudentAssignmentForTutor,
  createOrReuseChatTransaction,
} from '../models/mobile-messaging.model';
import type {
  TutorInboxRawRow,
} from '../models/mobile-messaging.model';
import {
  findChatById,
  userParticipatesInChat,
  findMessagesByChatId,
  countMessagesByChatId,
  markIncomingMessagesAsRead,
  insertMessage,
} from '../models/messaging.model';
import type {
  TutorChatInboxEntry,
  TutorChatInboxAlumno,
  TutorChatInboxDocente,
  TutorChatInboxMateria,
  StartChatResult,
} from '../types/mobile-messaging.types';
import type { MessageResponse, PaginationMeta } from '../types/messaging.types';

function mapInboxRow(row: TutorInboxRawRow): TutorChatInboxEntry {
  return {
    chat_id: row.chat_id,
    asignacion_id: row.asignacion_id,
    alumno: {
      alumno_id: row.alumno_id,
      nombre: row.alumno_nombre,
      apellido: row.alumno_apellido,
    } satisfies TutorChatInboxAlumno,
    docente: {
      docente_id: row.docente_id,
      nombre: row.docente_nombre,
      apellido: row.docente_apellido,
    } satisfies TutorChatInboxDocente,
    materia: {
      materia_id: row.materia_id,
      nombre: row.materia_nombre,
    } satisfies TutorChatInboxMateria,
    ultimo_mensaje: row.ultimo_mensaje ?? null,
    ultima_fecha: row.ultima_fecha ?? null,
    no_leidos: row.no_leidos,
  };
}

function mapMessageRow(row: Record<string, unknown>): MessageResponse {
  return {
    mensaje_id: row.mensaje_id as number,
    remitente_id: row.remitente_id as number,
    contenido: row.contenido as string,
    leido: row.leido as boolean,
    fecha_envio: row.fecha_envio as string,
  };
}

export async function getChatsForTutor(
  tutorId: number,
): Promise<TutorChatInboxEntry[]> {
  const rows = await findChatsByTutorId(tutorId);
  return rows.map(mapInboxRow);
}

export async function startChatForTutor(
  tutorId: number,
  input: {
    alumno_id: number;
    asignacion_id: number;
    contenido: string;
  },
): Promise<StartChatResult> {
  const link = await findLinkedStudentAssignmentForTutor(
    tutorId,
    input.alumno_id,
    input.asignacion_id,
  );

  if (!link) {
    const studentLinked = await queryTutorStudentLinkExists(
      tutorId,
      input.alumno_id,
    );
    if (!studentLinked) {
      throw new AppError('Student not found', HTTP_STATUS.NOT_FOUND);
    }
    throw new AppError('Assignment not found', HTTP_STATUS.NOT_FOUND);
  }

  const result = await createOrReuseChatTransaction(
    tutorId,
    input.alumno_id,
    input.asignacion_id,
    link.docente_id,
    input.contenido,
  );

  return result;
}

async function queryTutorStudentLinkExists(
  tutorId: number,
  alumnoId: number,
): Promise<boolean> {
  const { query } = await import('../db/connection');
  const rows = await query(
    'SELECT 1 FROM tutor_alumno WHERE tutor_id = $1 AND alumno_id = $2 LIMIT 1',
    [tutorId, alumnoId],
  );
  return rows.length > 0;
}

export async function getMessagesForTutorChat(
  tutorId: number,
  chatId: number,
  page: number,
  limit: number,
): Promise<{ messages: MessageResponse[]; pagination: PaginationMeta }> {
  const chat = await findChatById(chatId);
  if (!chat) {
    throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND);
  }

  const participates = await userParticipatesInChat(tutorId, chatId);
  if (!participates) {
    throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND);
  }

  await markIncomingMessagesAsRead(chatId, tutorId);

  const offset = (page - 1) * limit;
  const rows = await findMessagesByChatId(chatId, offset, limit);
  const total = await countMessagesByChatId(chatId);
  const totalPages = Math.ceil(total / limit);

  return {
    messages: rows.map(mapMessageRow),
    pagination: {
      page,
      limit,
      total,
      total_pages: totalPages,
    },
  };
}

export async function sendMessageForTutorChat(
  tutorId: number,
  chatId: number,
  contenido: string,
): Promise<MessageResponse> {
  const chat = await findChatById(chatId);
  if (!chat) {
    throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND);
  }

  const participates = await userParticipatesInChat(tutorId, chatId);
  if (!participates) {
    throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND);
  }

  const row = await insertMessage(chatId, tutorId, contenido);
  return mapMessageRow(row);
}
