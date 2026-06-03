import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants';
import {
  getAnnouncementsForUser,
  publishAnnouncement,
} from '../services/announcements.service';

export async function getAnnouncementsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const data = await getAnnouncementsForUser(userId, role);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function publishAnnouncementHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const data = await publishAnnouncement(userId, role, req.body);
    sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}
