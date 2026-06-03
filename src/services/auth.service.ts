import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants';
import { findUserByEmail, findUserById } from '../models/user.model';
import { sanitizeUser } from '../utils/sanitizeUser';

export interface PublicUser {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  foto_url: string | null;
}

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  const token = jwt.sign(
    { userId: user.id, role: user.rol },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions,
  );

  return { token, user: sanitizeUser(user) };
}

export async function getCurrentUser(userId: number): Promise<PublicUser> {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
  }

  return sanitizeUser(user);
}
