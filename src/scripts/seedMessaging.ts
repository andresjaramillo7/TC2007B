import pool from '../db/connection';

interface UserRow {
  id: number;
  email: string;
}

interface StudentRow {
  id: number;
  nombre: string;
  apellido: string;
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
      console.error('Run `bun run seed:academic` before `bun run seed:messaging`.');
      await client.query('ROLLBACK');
      return;
    }

    // Create tutor-alumno relationships
    await client.query(
      `INSERT INTO tutor_alumno (tutor_id, alumno_id, parentesco)
       VALUES ($1, $2, $3)
       ON CONFLICT (tutor_id, alumno_id) DO NOTHING`,
      [tutorId, mateoId, 'padre'],
    );
    await client.query(
      `INSERT INTO tutor_alumno (tutor_id, alumno_id, parentesco)
       VALUES ($1, $2, $3)
       ON CONFLICT (tutor_id, alumno_id) DO NOTHING`,
      [tutorId, sofiaId, 'padre'],
    );

    // Helper to find existing chat
    async function findExistingChat(
      alumno_id: number,
      teacher_id: number,
      tutor_id: number,
    ): Promise<number | null> {
      const result = await client.query(
        `SELECT c.id
         FROM chats c
         JOIN chat_participantes cp1 ON cp1.chat_id = c.id AND cp1.usuario_id = $2
         JOIN chat_participantes cp2 ON cp2.chat_id = c.id AND cp2.usuario_id = $3
         WHERE c.alumno_id = $1
         LIMIT 1`,
        [alumno_id, teacher_id, tutor_id],
      );
      return result.rows.length > 0 ? (result.rows[0] as ChatRow).id : null;
    }

    // Chat 1: teacher1 + tutor about Mateo
    let chat1Id = await findExistingChat(mateoId, teacher1Id, tutorId);
    if (!chat1Id) {
      const chatResult = await client.query<ChatRow>(
        `INSERT INTO chats (alumno_id) VALUES ($1) RETURNING id`,
        [mateoId],
      );
      chat1Id = chatResult.rows[0].id;

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

      // Seed messages for chat 1
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

      console.log(`  ✓ Chat 1 (${chat1Id}): teacher1 + tutor about Mateo`);
    } else {
      console.log(`  ✓ Chat 1 (${chat1Id}): already exists, skipped`);
    }

    // Chat 2: teacher2 + tutor about Mateo
    let chat2Id = await findExistingChat(mateoId, teacher2Id, tutorId);
    if (!chat2Id) {
      const chatResult = await client.query<ChatRow>(
        `INSERT INTO chats (alumno_id) VALUES ($1) RETURNING id`,
        [mateoId],
      );
      chat2Id = chatResult.rows[0].id;

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

      console.log(`  ✓ Chat 2 (${chat2Id}): teacher2 + tutor about Mateo`);
    } else {
      console.log(`  ✓ Chat 2 (${chat2Id}): already exists, skipped`);
    }

    // Chat 3: teacher1 + tutor about Sofía (empty chat)
    let chat3Id = await findExistingChat(sofiaId, teacher1Id, tutorId);
    if (!chat3Id) {
      const chatResult = await client.query<ChatRow>(
        `INSERT INTO chats (alumno_id) VALUES ($1) RETURNING id`,
        [sofiaId],
      );
      chat3Id = chatResult.rows[0].id;

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

      console.log(`  ✓ Chat 3 (${chat3Id}): teacher1 + tutor about Sofía (empty)`);
    } else {
      console.log(`  ✓ Chat 3 (${chat3Id}): already exists, skipped`);
    }

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
