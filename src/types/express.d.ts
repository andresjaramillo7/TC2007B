import { Role } from '../constants';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: Role;
      };
    }
  }
}
