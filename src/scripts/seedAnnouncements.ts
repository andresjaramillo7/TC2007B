import pool from '../db/connection';

interface UserRow {
  id: number;
  email: string;
}

interface GroupRow {
  id: number;
  grado: number;
  grupo_letra: string;
}

async function seedAnnouncements(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const usersResult = await client.query<UserRow>(
      'SELECT id, email FROM usuarios WHERE email = ANY($1)',
      [['teacher@example.com', 'teacher2@example.com', 'admin@example.com']],
    );

    const userMap = new Map<string, number>();
    for (const row of usersResult.rows) {
      userMap.set(row.email, row.id);
    }

    const requiredEmails = ['teacher@example.com', 'teacher2@example.com', 'admin@example.com'];
    const missing = requiredEmails.filter((e) => !userMap.has(e));
    if (missing.length > 0) {
      console.error('ERROR: Required users not found.');
      console.error('Run `bun run seed` before `bun run seed:announcements`.');
      console.error(`Missing: ${missing.join(', ')}`);
      await client.query('ROLLBACK');
      return;
    }

    const teacher1Id = userMap.get('teacher@example.com')!;
    const teacher2Id = userMap.get('teacher2@example.com')!;
    const adminId = userMap.get('admin@example.com')!;

    const groupsResult = await client.query<GroupRow>(
      'SELECT id, grado, grupo_letra FROM grupos WHERE ciclo_escolar = $1',
      ['2026-2027'],
    );

    if (groupsResult.rows.length === 0) {
      console.error('ERROR: No groups found. Run `bun run seed:academic` first.');
      await client.query('ROLLBACK');
      return;
    }

    const groupMap = new Map<string, number>();
    for (const row of groupsResult.rows) {
      groupMap.set(`${row.grado}-${row.grupo_letra}`, row.id);
    }

    const grupo1A = groupMap.get('1-A');
    const grupo2B = groupMap.get('2-B');
    const grupo3C = groupMap.get('3-C');

    if (!grupo1A || !grupo2B || !grupo3C) {
      console.error('ERROR: Required groups (1-A, 2-B, 3-C) not found.');
      console.error('Run `bun run seed:academic` before `bun run seed:announcements`.');
      await client.query('ROLLBACK');
      return;
    }

    const announcements = [
      {
        remitente_id: teacher1Id,
        grupo_id: grupo1A,
        titulo: 'Material para matemáticas',
        contenido: 'Traer regla y cuaderno cuadriculado.',
      },
      {
        remitente_id: teacher1Id,
        grupo_id: grupo2B,
        titulo: 'Actividad de ciencias',
        contenido: 'Preparar la exposición para el viernes.',
      },
      {
        remitente_id: teacher2Id,
        grupo_id: grupo1A,
        titulo: 'Lectura de historia',
        contenido: 'Leer las páginas 20 a 25.',
      },
      {
        remitente_id: adminId,
        grupo_id: grupo3C,
        titulo: 'Aviso administrativo',
        contenido: 'Reunión general el próximo lunes.',
      },
    ];

    let inserted = 0;
    for (const ann of announcements) {
      const result = await client.query(
        `INSERT INTO avisos_grupales (remitente_id, grupo_id, titulo, contenido)
         SELECT $1::int, $2::int, $3::varchar, $4::text
         WHERE NOT EXISTS (
           SELECT 1 FROM avisos_grupales
           WHERE remitente_id = $1::int AND grupo_id = $2::int
             AND titulo = $3::varchar AND contenido = $4::text
         )`,
        [ann.remitente_id, ann.grupo_id, ann.titulo, ann.contenido],
      );
      if (result.rowCount && result.rowCount > 0) {
        inserted++;
      }
    }

    await client.query('COMMIT');
    console.log(`Announcements seeded successfully. Inserted ${inserted} new record(s).`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Announcements seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedAnnouncements().catch((err) => {
  console.error(err);
  process.exit(1);
});
