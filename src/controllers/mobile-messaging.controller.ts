import type { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessWithPagination } from '../utils/apiResponse';
import {
  getChatsForTutor,
  startChatForTutor,
  getMessagesForTutorChat,
  sendMessageForTutorChat,
} from '../services/mobile-messaging.service';

export async function getMobileChatsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const data = await getChatsForTutor(userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function startMobileChatHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const { alumno_id, asignacion_id, contenido } = req.body;

    const result = await startChatForTutor(userId, {
      alumno_id,
      asignacion_id,
      contenido,
    });

    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
}

export async function getMobileChatMessagesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const chatId = Number(req.params.chat_id);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const { messages, pagination } = await getMessagesForTutorChat(
      userId,
      chatId,
      page,
      limit,
    );

    sendSuccessWithPagination(
      res,
      messages,
      pagination.total,
      pagination.page,
      pagination.limit,
    );
  } catch (error) {
    next(error);
  }
}

export async function sendMobileChatMessageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const chatId = Number(req.params.chat_id);
    const { contenido } = req.body;

    const message = await sendMessageForTutorChat(userId, chatId, contenido);
    sendSuccess(res, message, 201);
  } catch (error) {
    next(error);
  }
}
