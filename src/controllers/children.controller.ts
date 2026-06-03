import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import { getChildrenForTutor } from '../services/children.service';

export async function getChildrenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const data = await getChildrenForTutor(userId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
