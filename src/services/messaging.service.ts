import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants';
import {
  findChatsByParticipantId,
  findAllChats,
  findChatById,
  userParticipatesInChat,
  findMessagesByChatId,
  countMessagesByChatId,
  markIncomingMessagesAsRead,
  insertMessage,
} from '../models/messaging.model';
import type { ChatInboxEntry, MessageResponse, PaginationMeta } from '../types/messaging.types';
import type { InboxRawRow } from '../models/messaging.model';
import type { Role } from '../constants';

function mapInboxRow(row: InboxRawRow): ChatInboxEntry {
  return {
    chat_id: row.chat_id,
    tutor: {
      tutor_id: row.tutor_id,
      nombre: row.tutor_nombre,
      apellido: row.tutor_apellido,
    },
    alumno: {
      alumno_id: row.alumno_id,
      nombre: row.alumno_nombre,
      apellido: row.alumno_apellido,
    },
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

export async function getChatsForUser(
  userId: number,
  role: Role,
): Promise<ChatInboxEntry[]> {
  let rows: InboxRawRow[];

  if (role === 'admin') {
    rows = await findAllChats();
  } else {
    rows = await findChatsByParticipantId(userId);
  }

  return rows.map(mapInboxRow);
}

export async function getMessagesForChat(
  userId: number,
  role: Role,
  chatId: number,
  page: number,
  limit: number,
): Promise<{ messages: MessageResponse[]; pagination: PaginationMeta }> {
  const chat = await findChatById(chatId);
  if (!chat) {
    throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND);
  }

  if (role === 'docente') {
    const participates = await userParticipatesInChat(userId, chatId);
    if (!participates) {
      throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND);
    }

    await markIncomingMessagesAsRead(chatId, userId);
  }

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

export async function sendMessage(
  userId: number,
  role: Role,
  chatId: number,
  contenido: string,
): Promise<MessageResponse> {
  const chat = await findChatById(chatId);
  if (!chat) {
    throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND);
  }

  if (role === 'docente') {
    const participates = await userParticipatesInChat(userId, chatId);
    if (!participates) {
      throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND);
    }
  }

  const row = await insertMessage(chatId, userId, contenido);
  return mapMessageRow(row);
}
