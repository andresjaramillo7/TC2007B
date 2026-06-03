import pool from '../db/connection';
import bcrypt from 'bcryptjs';

const SEED_USERS = [
  { email: 'teacher@example.com', password: 'password123', nombre: 'Ana', apellido: 'López', rol: 'docente' },
  { email: 'teacher2@example.com', password: 'password123', nombre: 'Pedro', apellido: 'Ruiz', rol: 'docente' },
  { email: 'tutor@example.com', password: 'password123', nombre: 'Carlos', apellido: 'García', rol: 'tutor' },
  { email: 'admin@example.com', password: 'password123', nombre: 'María', apellido: 'Administrador', rol: 'admin' },
];

async function seed() {
  console.log('Seeding users...');

  for (const user of SEED_USERS) {
    const password_hash = await bcrypt.hash(user.password, 10);

    await pool.query(
      `INSERT INTO usuarios (email, password_hash, nombre, apellido, rol)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [user.email, password_hash, user.nombre, user.apellido, user.rol],
    );

    console.log(`  ✓ ${user.email} (${user.rol})`);
  }

  console.log('Done.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
