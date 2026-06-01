import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants';
import { Role } from '../constants';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: number; role: string };
    req.user = { userId: decoded.userId, role: decoded.role as Role };
    next();
  } catch {
    throw new AppError('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED);
  }
}
