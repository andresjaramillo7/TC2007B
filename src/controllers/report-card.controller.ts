import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import { getConsolidatedReportCard, signReportCard } from '../services/report-card.service';
import { generateReportCardPdf } from '../services/report-card-pdf.service';

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

export async function signReportCardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const studentId = Number(req.params.alumno_id);
    const periodo = String(req.params.periodo);
    const result = await signReportCard(userId, studentId, periodo);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function downloadReportCardPdfHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const studentId = Number(req.params.alumno_id);
    const { buffer, filename } = await generateReportCardPdf(userId, studentId);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    res.set('Content-Length', String(buffer.length));
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
