import pool from '../db/connection';

async function seedAcademicData(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify required users exist
    const usersResult = await client.query(
      "SELECT email, id FROM usuarios WHERE email = ANY($1)",
      [['teacher@example.com', 'teacher2@example.com', 'admin@example.com']],
    );

    const userMap = new Map<string, number>();
    for (const row of usersResult.rows) {
      userMap.set(row.email, row.id);
    }

    const requiredEmails = ['teacher@example.com', 'teacher2@example.com', 'admin@example.com'];
    const missing = requiredEmails.filter((e) => !userMap.has(e));
    if (missing.length > 0) {
      console.error(
        'ERROR: Required users not found in database.',
      );
      console.error(
        'Run `bun run seed` before `bun run seed:academic`.',
      );
      console.error(`Missing: ${missing.join(', ')}`);
      await client.query('ROLLBACK');
      return;
    }

    const teacher1Id = userMap.get('teacher@example.com')!;
    const teacher2Id = userMap.get('teacher2@example.com')!;

    // Insert groups
    await client.query(
      `INSERT INTO grupos (grado, grupo_letra, ciclo_escolar)
       VALUES ($1, $2, $3)
       ON CONFLICT (grado, grupo_letra, ciclo_escolar) DO NOTHING`,
      [1, 'A', '2026-2027'],
    );
    await client.query(
      `INSERT INTO grupos (grado, grupo_letra, ciclo_escolar)
       VALUES ($1, $2, $3)
       ON CONFLICT (grado, grupo_letra, ciclo_escolar) DO NOTHING`,
      [2, 'B', '2026-2027'],
    );
    await client.query(
      `INSERT INTO grupos (grado, grupo_letra, ciclo_escolar)
       VALUES ($1, $2, $3)
       ON CONFLICT (grado, grupo_letra, ciclo_escolar) DO NOTHING`,
      [3, 'C', '2026-2027'],
    );

    // Fetch group IDs
    const groupsResult = await client.query(
      "SELECT id, grado, grupo_letra FROM grupos WHERE ciclo_escolar = '2026-2027'",
    );
    const groupMap = new Map<string, number>();
    for (const row of groupsResult.rows) {
      groupMap.set(`${row.grado}-${row.grupo_letra}`, row.id);
    }

    const grupo1A = groupMap.get('1-A')!;
    const grupo2B = groupMap.get('2-B')!;
    const grupo3C = groupMap.get('3-C')!;

    // Insert subjects
    await client.query(
      `INSERT INTO materias (nombre_materia) VALUES ($1) ON CONFLICT (nombre_materia) DO NOTHING`,
      ['Matemáticas'],
    );
    await client.query(
      `INSERT INTO materias (nombre_materia) VALUES ($1) ON CONFLICT (nombre_materia) DO NOTHING`,
      ['Historia'],
    );
    await client.query(
      `INSERT INTO materias (nombre_materia) VALUES ($1) ON CONFLICT (nombre_materia) DO NOTHING`,
      ['Ciencias'],
    );

    const subjectsResult = await client.query('SELECT id, nombre_materia FROM materias');
    const subjectMap = new Map<string, number>();
    for (const row of subjectsResult.rows) {
      subjectMap.set(row.nombre_materia, row.id);
    }

    const matematicasId = subjectMap.get('Matemáticas')!;
    const historiaId = subjectMap.get('Historia')!;
    const cienciasId = subjectMap.get('Ciencias')!;

    // Insert assignments
    await client.query(
      `INSERT INTO asignaciones_docentes (docente_id, grupo_id, materia_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (docente_id, grupo_id, materia_id) DO NOTHING`,
      [teacher1Id, grupo1A, matematicasId],
    );
    await client.query(
      `INSERT INTO asignaciones_docentes (docente_id, grupo_id, materia_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (docente_id, grupo_id, materia_id) DO NOTHING`,
      [teacher1Id, grupo2B, cienciasId],
    );
    await client.query(
      `INSERT INTO asignaciones_docentes (docente_id, grupo_id, materia_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (docente_id, grupo_id, materia_id) DO NOTHING`,
      [teacher2Id, grupo1A, historiaId],
    );

    // Insert students
    const students = [
      { nombre: 'Mateo', apellido: 'Jaramillo', grupo_id: grupo1A, foto_url: null },
      { nombre: 'Sofía', apellido: 'Martínez', grupo_id: grupo1A, foto_url: null },
      { nombre: 'Diego', apellido: 'Ramírez', grupo_id: grupo1A, foto_url: null },
      { nombre: 'Valentina', apellido: 'López', grupo_id: grupo1A, foto_url: null },
      { nombre: 'Luis', apellido: 'Hernández', grupo_id: grupo2B, foto_url: null },
      { nombre: 'Camila', apellido: 'García', grupo_id: grupo2B, foto_url: null },
      { nombre: 'Andrés', apellido: 'Torres', grupo_id: grupo2B, foto_url: null },
      { nombre: 'Isabella', apellido: 'Cruz', grupo_id: grupo3C, foto_url: null },
      { nombre: 'Emiliano', apellido: 'Reyes', grupo_id: grupo3C, foto_url: null },
      { nombre: 'Regina', apellido: 'Morales', grupo_id: grupo3C, foto_url: null },
    ];

    for (const s of students) {
      await client.query(
        `INSERT INTO alumnos (nombre, apellido, grupo_id, foto_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (nombre, apellido, grupo_id) DO NOTHING`,
        [s.nombre, s.apellido, s.grupo_id, s.foto_url],
      );
    }

    await client.query('COMMIT');
    console.log('Academic data seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Academic seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedAcademicData().catch((err) => {
  console.error(err);
  process.exit(1);
});
