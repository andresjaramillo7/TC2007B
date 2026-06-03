import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import {
  getAssignmentsForUser,
  getStudentsForAuthorizedGroup,
} from '../services/academic.service';

export async function getAssignmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const data = await getAssignmentsForUser(userId, role);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getStudentsByGroupHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const grupoId = Number(req.params.grupo_id);
    const data = await getStudentsForAuthorizedGroup(userId, role, grupoId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
