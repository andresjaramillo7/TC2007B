import { Request, Response, NextFunction } from 'express';

export function authPlaceholder(_req: Request, _res: Response, next: NextFunction): void {
  next();
}
