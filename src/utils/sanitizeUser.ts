import { UserRow } from '../models/user.model';

export interface PublicUser {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  foto_url: string | null;
}

export function sanitizeUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    apellido: user.apellido,
    rol: user.rol,
    foto_url: user.foto_url,
  };
}
