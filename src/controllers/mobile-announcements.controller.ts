import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import { getAnnouncementsForTutor } from '../services/mobile-announcements.service';

export async function getMobileAnnouncementsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const data = await getAnnouncementsForTutor(userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
