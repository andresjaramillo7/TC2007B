import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import { getConsolidatedReportCard } from '../services/report-card.service';

export async function getChildReportCardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const studentId = Number(req.params.alumno_id);
    const data = await getConsolidatedReportCard(userId, studentId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
