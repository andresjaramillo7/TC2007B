import pool from '../db/connection';

interface UserRow {
  id: number;
  email: string;
}

interface AssignmentRow {
  id: number;
  docente_id: number;
}

interface StudentRow {
  id: number;
  nombre: string;
  apellido: string;
}

async function seedGrades(): Promise<void> {
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

    const requiredEmails = ['teacher@example.com', 'teacher2@example.com'];
    const missing = requiredEmails.filter((e) => !userMap.has(e));
    if (missing.length > 0) {
      console.error('ERROR: Required users not found.');
      console.error('Run `bun run seed` before `bun run seed:grades`.');
      console.error(`Missing: ${missing.join(', ')}`);
      await client.query('ROLLBACK');
      return;
    }

    const teacher1Id = userMap.get('teacher@example.com')!;
    const teacher2Id = userMap.get('teacher2@example.com')!;

    const assignmentsResult = await client.query<AssignmentRow>(
      `SELECT id, docente_id FROM asignaciones_docentes
       WHERE docente_id IN ($1, $2)`,
      [teacher1Id, teacher2Id],
    );

    const teacher1Assignments = assignmentsResult.rows.filter(
      (r) => r.docente_id === teacher1Id,
    );
    const teacher2Assignments = assignmentsResult.rows.filter(
      (r) => r.docente_id === teacher2Id,
    );

    if (teacher1Assignments.length === 0 || teacher2Assignments.length === 0) {
      console.error('ERROR: Not enough assignments found.');
      console.error('Run `bun run seed:academic` before `bun run seed:grades`.');
      await client.query('ROLLBACK');
      return;
    }

    const matematicasAssignmentId = teacher1Assignments[0].id;
    const historiaAssignmentId = teacher2Assignments[0].id;

    const studentsResult = await client.query<StudentRow>(
      `SELECT id, nombre, apellido FROM alumnos
       WHERE (nombre, apellido) IN (('Mateo', 'Jaramillo'), ('Sofía', 'Martínez'))`,
    );

    const studentMap = new Map<string, number>();
    for (const row of studentsResult.rows) {
      studentMap.set(`${row.nombre} ${row.apellido}`, row.id);
    }

    const mateoId = studentMap.get('Mateo Jaramillo');
    const sofiaId = studentMap.get('Sofía Martínez');

    if (!mateoId || !sofiaId) {
      console.error('ERROR: Required students not found.');
      console.error('Ensure seed:academic has been run.');
      await client.query('ROLLBACK');
      return;
    }

    // Ana López → Matemáticas → 1° A → Mateo: 9.5
    await client.query(
      `INSERT INTO calificaciones (alumno_id, asignacion_docente_id, periodo, calificacion, comentario)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (alumno_id, asignacion_docente_id, periodo) DO NOTHING`,
      [mateoId, matematicasAssignmentId, 'primer trimestre', 9.5, 'Excelente'],
    );

    // Ana López → Matemáticas → 1° A → Sofía: 8.7
    await client.query(
      `INSERT INTO calificaciones (alumno_id, asignacion_docente_id, periodo, calificacion, comentario)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (alumno_id, asignacion_docente_id, periodo) DO NOTHING`,
      [sofiaId, matematicasAssignmentId, 'primer trimestre', 8.7, null],
    );

    // Pedro Ruiz → Historia → 1° A → Mateo: 8.0
    await client.query(
      `INSERT INTO calificaciones (alumno_id, asignacion_docente_id, periodo, calificacion, comentario)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (alumno_id, asignacion_docente_id, periodo) DO NOTHING`,
      [mateoId, historiaAssignmentId, 'primer trimestre', 8.0, null],
    );

    await client.query('COMMIT');
    console.log('Grades seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Grades seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedGrades().catch((err) => {
  console.error(err);
  process.exit(1);
});
