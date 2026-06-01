import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants';
import { Role } from '../constants';

export function authorizeRoles(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
    }

    next();
  };
}
