import type { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessWithPagination } from '../utils/apiResponse';
import {
  getChatsForUser,
  getMessagesForChat,
  sendMessage,
} from '../services/messaging.service';

export async function getChatsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const data = await getChatsForUser(userId, role);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getMessagesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const chatId = Number(req.params.chat_id);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const { messages, pagination } = await getMessagesForChat(
      userId,
      role,
      chatId,
      page,
      limit,
    );

    sendSuccessWithPagination(res, messages, pagination.total, pagination.page, pagination.limit);
  } catch (error) {
    next(error);
  }
}

export async function sendMessageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const chatId = Number(req.params.chat_id);
    const { contenido } = req.body;

    const message = await sendMessage(userId, role, chatId, contenido);
    sendSuccess(res, message, 201);
  } catch (error) {
    next(error);
  }
}
