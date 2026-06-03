import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import {
  getStudentGradeHistory,
  getAssignmentGradeTable,
  upsertSingleGrade,
  upsertBulkGrades,
} from '../services/grades.service';

export async function getStudentGradesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const alumnoId = Number(req.params.alumno_id);
    const data = await getStudentGradeHistory(userId, role, alumnoId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getAssignmentGradesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const asignacionId = Number(req.params.asignacion_id);
    const periodo = req.query.periodo as string;
    const data = await getAssignmentGradeTable(userId, role, asignacionId, periodo);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function upsertGradeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const data = await upsertSingleGrade(userId, role, req.body);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function upsertBulkGradesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const data = await upsertBulkGrades(userId, role, req.body);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
