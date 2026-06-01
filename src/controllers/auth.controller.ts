import { Request, Response, NextFunction } from 'express';
import { login, getCurrentUser } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getMeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getCurrentUser(req.user!.userId);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}
