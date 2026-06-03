import pool from '../db/connection';

interface UserRow {
  id: number;
  email: string;
}

interface StudentRow {
  id: number;
  nombre: string;
  apellido: string;
  grupo_id: number;
}

interface AssignmentRow {
  id: number;
  docente_id: number;
  materia_nombre: string;
  grupo_id: number;
}

interface ChatRow {
  id: number;
}

async function seedMessaging(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch required users
    const usersResult = await client.query<UserRow>(
      'SELECT id, email FROM usuarios WHERE email = ANY($1)',
      [['teacher@example.com', 'teacher2@example.com', 'tutor@example.com']],
    );

    const userMap = new Map<string, number>();
    for (const row of usersResult.rows) {
      userMap.set(row.email, row.id);
    }

    const requiredEmails = ['teacher@example.com', 'teacher2@example.com', 'tutor@example.com'];
    const missing = requiredEmails.filter((e) => !userMap.has(e));
    if (missing.length > 0) {
      console.error('ERROR: Required users not found.');
      console.error('Run `bun run seed` before `bun run seed:messaging`.');
      console.error(`Missing: ${missing.join(', ')}`);
      await client.query('ROLLBACK');
      return;
    }

    const teacher1Id = userMap.get('teacher@example.com')!;
    const teacher2Id = userMap.get('teacher2@example.com')!;
    const tutorId = userMap.get('tutor@example.com')!;

    // Fetch required students
    const studentsResult = await client.query<StudentRow>(
      `SELECT id, nombre, apellido, grupo_id FROM alumnos
       WHERE (nombre, apellido) IN (('Mateo', 'Jaramillo'), ('Sofía', 'Martínez'))`,
    );

    const studentMap = new Map<string, StudentRow>();
    for (const row of studentsResult.rows) {
      studentMap.set(`${row.nombre} ${row.apellido}`, row);
    }

    const mateo = studentMap.get('Mateo Jaramillo');
    const sofia = studentMap.get('Sofía Martínez');

    if (!mateo || !sofia) {
      console.error('ERROR: Required students not found.');
      console.error('Run `bun run seed:academic` before `bun run seed:messaging`.');
      await client.query('ROLLBACK');
      return;
    }

    // Fetch required assignments
    const assignmentsResult = await client.query<AssignmentRow>(
      `SELECT ad.id, ad.docente_id, ad.grupo_id, m.nombre_materia
       FROM asignaciones_docentes ad
       JOIN materias m ON m.id = ad.materia_id
       WHERE (ad.docente_id, ad.grupo_id, m.nombre_materia) IN (
         ($1, $2, 'Matemáticas'),
         ($3, $2, 'Historia')
       )`,
      [teacher1Id, mateo.grupo_id, teacher2Id],
    );

    if (assignmentsResult.rows.length < 2) {
      console.error('ERROR: Required assignments not found.');
      console.error('Run `bun run seed:academic` before `bun run seed:messaging`.');
      await client.query('ROLLBACK');
      return;
    }

    const matematicasAssignment = assignmentsResult.rows.find(
      (r) => r.docente_id === teacher1Id && r.materia_nombre === 'Matemáticas',
    )!;
    const historiaAssignment = assignmentsResult.rows.find(
      (r) => r.docente_id === teacher2Id && r.materia_nombre === 'Historia',
    )!;

    // Create tutor-alumno relationships
    await client.query(
      `INSERT INTO tutor_alumno (tutor_id, alumno_id, parentesco)
       VALUES ($1, $2, $3)
       ON CONFLICT (tutor_id, alumno_id) DO NOTHING`,
      [tutorId, mateo.id, 'padre'],
    );
    await client.query(
      `INSERT INTO tutor_alumno (tutor_id, alumno_id, parentesco)
       VALUES ($1, $2, $3)
       ON CONFLICT (tutor_id, alumno_id) DO NOTHING`,
      [tutorId, sofia.id, 'padre'],
    );

    // Helper to create or reuse a contextual chat
    async function findOrCreateChat(
      alumnoId: number,
      asignacionDocenteId: number,
    ): Promise<number> {
      const insertResult = await client.query<ChatRow>(
        `INSERT INTO chats (alumno_id, asignacion_docente_id)
         VALUES ($1, $2)
         ON CONFLICT (alumno_id, asignacion_docente_id) DO NOTHING
         RETURNING id`,
        [alumnoId, asignacionDocenteId],
      );

      if (insertResult.rows.length > 0) {
        return insertResult.rows[0].id;
      }

      const existing = await client.query<ChatRow>(
        'SELECT id FROM chats WHERE alumno_id = $1 AND asignacion_docente_id = $2',
        [alumnoId, asignacionDocenteId],
      );
      return existing.rows[0].id;
    }

    // Chat 1: teacher1 (Ana López → Matemáticas → 1° A) + tutor about Mateo
    const chat1Id = await findOrCreateChat(mateo.id, matematicasAssignment.id);

    await client.query(
      `INSERT INTO chat_participantes (chat_id, usuario_id) VALUES ($1, $2)
       ON CONFLICT (chat_id, usuario_id) DO NOTHING`,
      [chat1Id, teacher1Id],
    );
    await client.query(
      `INSERT INTO chat_participantes (chat_id, usuario_id) VALUES ($1, $2)
       ON CONFLICT (chat_id, usuario_id) DO NOTHING`,
      [chat1Id, tutorId],
    );

    // Insert messages only if chat is new (no messages yet)
    const existingMsgCount = await client.query(
      'SELECT COUNT(*)::int AS count FROM mensajes WHERE chat_id = $1',
      [chat1Id],
    );

    if (existingMsgCount.rows[0].count === 0) {
      const messages = [
        { remitente_id: tutorId, contenido: 'Hola Miss, quería preguntarle cómo va Mateo en clase' },
        { remitente_id: teacher1Id, contenido: 'Hola Carlos, Mateo va muy bien, está participando mucho' },
        { remitente_id: tutorId, contenido: 'Qué bueno, gracias por la información' },
        { remitente_id: teacher1Id, contenido: 'De nada, cualquier cosa me avisa' },
        { remitente_id: tutorId, contenido: 'Disculpe, quería preguntarle sobre la tarea de esta semana' },
      ];

      for (const msg of messages) {
        await client.query(
          `INSERT INTO mensajes (chat_id, remitente_id, contenido)
           VALUES ($1, $2, $3)`,
          [chat1Id, msg.remitente_id, msg.contenido],
        );
      }

      // Mark messages 2-4 as read for the teacher (so teacher sees 2 unread from tutor)
      await client.query(
        `UPDATE mensajes SET leido = true, fecha_envio = fecha_envio + interval '1 minute'
         WHERE chat_id = $1 AND remitente_id = $2`,
        [chat1Id, teacher1Id],
      );
      // Mark first two tutor messages as read (teacher read them)
      await client.query(
        `UPDATE mensajes SET leido = true, fecha_envio = fecha_envio + interval '30 seconds'
         WHERE chat_id = $1 AND remitente_id = $2 AND id = (
           SELECT id FROM mensajes WHERE chat_id = $1 AND remitente_id = $2 ORDER BY fecha_envio LIMIT 1 OFFSET 0
         )`,
        [chat1Id, tutorId],
      );
      await client.query(
        `UPDATE mensajes SET leido = true, fecha_envio = fecha_envio + interval '30 seconds'
         WHERE chat_id = $1 AND remitente_id = $2 AND id = (
           SELECT id FROM mensajes WHERE chat_id = $1 AND remitente_id = $2 ORDER BY fecha_envio LIMIT 1 OFFSET 1
         )`,
        [chat1Id, tutorId],
      );
    }

    console.log(`  ✓ Chat 1 (${chat1Id}): teacher1 + tutor about Mateo (Matemáticas)`);

    // Chat 2: teacher2 (Pedro Ruiz → Historia → 1° A) + tutor about Mateo
    const chat2Id = await findOrCreateChat(mateo.id, historiaAssignment.id);

    await client.query(
      `INSERT INTO chat_participantes (chat_id, usuario_id) VALUES ($1, $2)
       ON CONFLICT (chat_id, usuario_id) DO NOTHING`,
      [chat2Id, teacher2Id],
    );
    await client.query(
      `INSERT INTO chat_participantes (chat_id, usuario_id) VALUES ($1, $2)
       ON CONFLICT (chat_id, usuario_id) DO NOTHING`,
      [chat2Id, tutorId],
    );

    const existingMsgCount2 = await client.query(
      'SELECT COUNT(*)::int AS count FROM mensajes WHERE chat_id = $1',
      [chat2Id],
    );

    if (existingMsgCount2.rows[0].count === 0) {
      const messages = [
        { remitente_id: teacher2Id, contenido: 'Hola Carlos, soy el profesor Pedro Ruiz, comento a Mateo en Historia' },
        { remitente_id: tutorId, contenido: 'Gracias profe, ¿cómo va en su clase?' },
        { remitente_id: teacher2Id, contenido: 'Va bien, pero necesita repasar los temas de la Revolución Mexicana' },
      ];

      for (const msg of messages) {
        await client.query(
          `INSERT INTO mensajes (chat_id, remitente_id, contenido)
           VALUES ($1, $2, $3)`,
          [chat2Id, msg.remitente_id, msg.contenido],
        );
      }
    }

    console.log(`  ✓ Chat 2 (${chat2Id}): teacher2 + tutor about Mateo (Historia)`);

    // Chat 3: teacher1 (Ana López → Matemáticas → 1° A) + tutor about Sofía (empty)
    const chat3Id = await findOrCreateChat(sofia.id, matematicasAssignment.id);

    await client.query(
      `INSERT INTO chat_participantes (chat_id, usuario_id) VALUES ($1, $2)
       ON CONFLICT (chat_id, usuario_id) DO NOTHING`,
      [chat3Id, teacher1Id],
    );
    await client.query(
      `INSERT INTO chat_participantes (chat_id, usuario_id) VALUES ($1, $2)
       ON CONFLICT (chat_id, usuario_id) DO NOTHING`,
      [chat3Id, tutorId],
    );

    console.log(`  ✓ Chat 3 (${chat3Id}): teacher1 + tutor about Sofía (Matemáticas, empty)`);

    await client.query('COMMIT');
    console.log('Messaging data seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Messaging seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedMessaging().catch((err) => {
  console.error(err);
  process.exit(1);
});
