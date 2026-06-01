import { query } from '../db/connection';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  nombre: string;
  apellido: string;
  rol: string;
  foto_url: string | null;
  created_at: string;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
  return rows.length > 0 ? (rows[0] as UserRow) : null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const rows = await query('SELECT * FROM usuarios WHERE id = $1', [id]);
  return rows.length > 0 ? (rows[0] as UserRow) : null;
}
