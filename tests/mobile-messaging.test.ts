import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock mobile-messaging model
jest.mock('../src/models/mobile-messaging.model', () => ({
  findChatsByTutorId: jest.fn(),
  findLinkedStudentAssignmentForTutor: jest.fn(),
  createOrReuseChatTransaction: jest.fn(),
}));

// Mock generic messaging model helpers
jest.mock('../src/models/messaging.model', () => ({
  findChatById: jest.fn(),
  userParticipatesInChat: jest.fn(),
  findMessagesByChatId: jest.fn(),
  countMessagesByChatId: jest.fn(),
  markIncomingMessagesAsRead: jest.fn(),
  insertMessage: jest.fn(),
}));

// Mock db connection pool for query helper used in service
jest.mock('../src/db/connection', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    query: jest.fn(),
  },
  query: jest.fn(),
}));

import app from '../src/app';
import { config } from '../src/config';
import {
  findChatsByTutorId,
  findLinkedStudentAssignmentForTutor,
  createOrReuseChatTransaction,
} from '../src/models/mobile-messaging.model';
import {
  findChatById,
  userParticipatesInChat,
  findMessagesByChatId,
  countMessagesByChatId,
  markIncomingMessagesAsRead,
  insertMessage,
} from '../src/models/messaging.model';
import mockPool, { query as mockQuery } from '../src/db/connection';

// ─── Mock data ──────────────────────────────────────────────────────────────────

const mockInboxRows = [
  {
    chat_id: 1,
    asignacion_id: 12,
    alumno_id: 5,
    alumno_nombre: 'Mateo',
    alumno_apellido: 'Jaramillo',
    docente_id: 1,
    docente_nombre: 'Ana',
    docente_apellido: 'López',
    materia_id: 3,
    materia_nombre: 'Matemáticas',
    ultimo_mensaje: 'Hola Miss, quería preguntarle...',
    ultima_fecha: '2026-06-03T15:00:00.000Z',
    no_leidos: 2,
  },
  {
    chat_id: 2,
    asignacion_id: 13,
    alumno_id: 5,
    alumno_nombre: 'Mateo',
    alumno_apellido: 'Jaramillo',
    docente_id: 2,
    docente_nombre: 'Pedro',
    docente_apellido: 'Ruiz',
    materia_id: 4,
    materia_nombre: 'Historia',
    ultimo_mensaje: null,
    ultima_fecha: null,
    no_leidos: 0,
  },
];

const mockMessages = [
  {
    mensaje_id: 101,
    remitente_id: 3,
    contenido: 'Buenas tardes',
    leido: true,
    fecha_envio: '2026-06-03T15:00:00.000Z',
  },
  {
    mensaje_id: 100,
    remitente_id: 1,
    contenido: 'Hola Carlos',
    leido: true,
    fecha_envio: '2026-06-03T14:00:00.000Z',
  },
];

const mockInsertedMessage = {
  mensaje_id: 102,
  remitente_id: 3,
  contenido: 'Enterado, gracias.',
  leido: false,
  fecha_envio: '2026-06-03T15:05:00.000Z',
};

const mockLinkedAssignment = {
  alumno_id: 5,
  docente_id: 1,
  grupo_id: 1,
};

const mockStartChatResult = {
  chat_id: 4,
  mensaje_id: 120,
  chat_creado: true,
};

const mockReuseChatResult = {
  chat_id: 1,
  mensaje_id: 121,
  chat_creado: false,
};

// ─── Token helpers ──────────────────────────────────────────────────────────────

function createToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, config.jwt.secret, {
    expiresIn: '8h',
  } as jwt.SignOptions);
}

const tutorToken = createToken(3, 'tutor');
const docenteToken = createToken(1, 'docente');
const adminToken = createToken(2, 'admin');

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Inbox ──────────────────────────────────────────────────────────────────────

describe('GET /api/movil/tutor/chats', () => {
  it('should return 200 with tutor chats', async () => {
    (findChatsByTutorId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(findChatsByTutorId).toHaveBeenCalledWith(3);
  });

  it('should include asignacion_id in response', async () => {
    (findChatsByTutorId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data[0]).toHaveProperty('asignacion_id');
    expect(res.body.data[0].asignacion_id).toBe(12);
  });

  it('should include nested alumno object', async () => {
    (findChatsByTutorId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data[0].alumno).toEqual({
      alumno_id: 5,
      nombre: 'Mateo',
      apellido: 'Jaramillo',
    });
  });

  it('should include nested docente object', async () => {
    (findChatsByTutorId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data[0].docente).toEqual({
      docente_id: 1,
      nombre: 'Ana',
      apellido: 'López',
    });
  });

  it('should include nested materia object', async () => {
    (findChatsByTutorId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data[0].materia).toEqual({
      materia_id: 3,
      nombre: 'Matemáticas',
    });
  });

  it('should include ultimo_mensaje and ultima_fecha', async () => {
    (findChatsByTutorId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data[0].ultimo_mensaje).toBe('Hola Miss, quería preguntarle...');
    expect(res.body.data[0].ultima_fecha).toBe('2026-06-03T15:00:00.000Z');
  });

  it('should include no_leidos count', async () => {
    (findChatsByTutorId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data[0].no_leidos).toBe(2);
  });

  it('should return null fields for empty chats', async () => {
    (findChatsByTutorId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data[1].ultimo_mensaje).toBeNull();
    expect(res.body.data[1].ultima_fecha).toBeNull();
    expect(res.body.data[1].no_leidos).toBe(0);
  });

  it('should return 200 with empty array when inbox is empty', async () => {
    (findChatsByTutorId as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return 403 for docente role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${docenteToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 403 for admin role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/movil/tutor/chats');

    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/chats')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
  });
});

// ─── Start or Reuse Chat ────────────────────────────────────────────────────────

describe('POST /api/movil/tutor/chats', () => {
  const validBody = {
    alumno_id: 5,
    asignacion_id: 12,
    contenido: 'Buenas tardes, quisiera hacer una consulta sobre la materia.',
  };

  it('should return 201 with chat_creado: true for new chat', async () => {
    (findLinkedStudentAssignmentForTutor as jest.Mock).mockResolvedValue(
      mockLinkedAssignment,
    );
    (createOrReuseChatTransaction as jest.Mock).mockResolvedValue(
      mockStartChatResult,
    );

    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toMatchObject({
      chat_id: 4,
      mensaje_id: 120,
      chat_creado: true,
    });
  });

  it('should return 201 with chat_creado: false for existing chat', async () => {
    (findLinkedStudentAssignmentForTutor as jest.Mock).mockResolvedValue(
      mockLinkedAssignment,
    );
    (createOrReuseChatTransaction as jest.Mock).mockResolvedValue(
      mockReuseChatResult,
    );

    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data.chat_creado).toBe(false);
  });

  it('should include chat_id and mensaje_id in response', async () => {
    (findLinkedStudentAssignmentForTutor as jest.Mock).mockResolvedValue(
      mockLinkedAssignment,
    );
    (createOrReuseChatTransaction as jest.Mock).mockResolvedValue(
      mockStartChatResult,
    );

    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.body.data).toHaveProperty('chat_id');
    expect(res.body.data).toHaveProperty('mensaje_id');
    expect(res.body.data).toHaveProperty('chat_creado');
  });

  it('should pass authenticated tutor ID to transaction model', async () => {
    (findLinkedStudentAssignmentForTutor as jest.Mock).mockResolvedValue(
      mockLinkedAssignment,
    );
    (createOrReuseChatTransaction as jest.Mock).mockResolvedValue(
      mockStartChatResult,
    );

    await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(createOrReuseChatTransaction).toHaveBeenCalledWith(
      3, // authenticated tutor ID
      5, // alumno_id
      12, // asignacion_id
      1, // docente_id
      validBody.contenido,
    );
  });

  it('should return 404 for unlinked student', async () => {
    // Student not linked: findLinkedStudentAssignmentForTutor returns null
    // The service checks tutor_alumno link via query; mock it returning empty
    (findLinkedStudentAssignmentForTutor as jest.Mock).mockResolvedValue(null);

    // The query helper used by queryTutorStudentLinkExists
    (mockQuery as jest.Mock).mockResolvedValue([]); // no link exists

    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Student not found');
  });

  it('should return 404 for invalid assignment', async () => {
    // Student IS linked but assignment doesn't belong to student's group
    (findLinkedStudentAssignmentForTutor as jest.Mock).mockResolvedValue(null);

    (mockQuery as jest.Mock).mockResolvedValue([{ alumno_id: 5 }]); // link exists

    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Assignment not found');
  });

  it('should return 400 for empty contenido', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ alumno_id: 5, asignacion_id: 12, contenido: '' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for whitespace-only contenido', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ alumno_id: 5, asignacion_id: 12, contenido: '   ' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for contenido over 2000 characters', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ alumno_id: 5, asignacion_id: 12, contenido: 'x'.repeat(2001) });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid alumno_id', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ alumno_id: -1, asignacion_id: 12, contenido: 'Hola' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid asignacion_id', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ alumno_id: 5, asignacion_id: 0, contenido: 'Hola' });

    expect(res.status).toBe(400);
  });

  it('should return 403 for docente role', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${docenteToken}`)
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it('should return 403 for admin role', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .send(validBody);

    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats')
      .set('Authorization', 'Bearer invalidtoken')
      .send(validBody);

    expect(res.status).toBe(401);
  });
});

// ─── Read Messages ──────────────────────────────────────────────────────────────

describe('GET /api/movil/tutor/chats/:chat_id/mensajes', () => {
  it('should return 200 with paginated messages for authorized tutor', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (findMessagesByChatId as jest.Mock).mockResolvedValue(mockMessages);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(2);

    const res = await request(app)
      .get('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      mensaje_id: 101,
      remitente_id: 3,
      contenido: 'Buenas tardes',
      leido: true,
    });
    expect(res.body.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 2,
      total_pages: 1,
    });
  });

  it('should return 404 for unauthorized chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 99 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .get('/api/movil/tutor/chats/99/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Chat not found');
  });

  it('should return same 404 for nonexistent chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/movil/tutor/chats/999/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Chat not found');
  });

  it('should return 400 for invalid chat_id', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/chats/abc/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(400);
  });

  it('should use default page=1 and limit=20 when omitted', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (findMessagesByChatId as jest.Mock).mockResolvedValue(mockMessages);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(2);

    const res = await request(app)
      .get('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(20);
  });

  it('should return 400 for invalid page', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/chats/1/mensajes?page=0')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for limit over 100', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/chats/1/mensajes?limit=200')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(400);
  });

  it('should include top-level pagination metadata', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (findMessagesByChatId as jest.Mock).mockResolvedValue(mockMessages);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(10);

    const res = await request(app)
      .get('/api/movil/tutor/chats/1/mensajes?page=2&limit=3')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.pagination).toEqual({
      page: 2,
      limit: 3,
      total: 10,
      total_pages: 4,
    });
  });

  it('should call markIncomingMessagesAsRead after authorization', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (findMessagesByChatId as jest.Mock).mockResolvedValue(mockMessages);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(2);

    await request(app)
      .get('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(markIncomingMessagesAsRead).toHaveBeenCalledWith(1, 3);
  });

  it('should NOT call markIncomingMessagesAsRead for unauthorized chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 99 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(false);

    await request(app)
      .get('/api/movil/tutor/chats/99/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(markIncomingMessagesAsRead).not.toHaveBeenCalled();
  });

  it('should NOT call markIncomingMessagesAsRead for nonexistent chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue(null);

    await request(app)
      .get('/api/movil/tutor/chats/999/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(markIncomingMessagesAsRead).not.toHaveBeenCalled();
  });

  it('should return empty data array for chat with no messages', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 3 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (findMessagesByChatId as jest.Mock).mockResolvedValue([]);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(0);

    const res = await request(app)
      .get('/api/movil/tutor/chats/3/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
    expect(res.body.pagination.total_pages).toBe(0);
  });

  it('should return 403 for docente role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${docenteToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 403 for admin role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/movil/tutor/chats/1/mensajes');

    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
  });
});

// ─── Send Message ──────────────────────────────────────────────────────────────

describe('POST /api/movil/tutor/chats/:chat_id/mensajes', () => {
  const validBody = {
    contenido: 'Enterado, gracias.',
  };

  it('should return 201 for tutor sending to authorized chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (insertMessage as jest.Mock).mockResolvedValue(mockInsertedMessage);

    const res = await request(app)
      .post('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toMatchObject({
      mensaje_id: 102,
      remitente_id: 3,
      contenido: 'Enterado, gracias.',
      leido: false,
    });
    expect(insertMessage).toHaveBeenCalledWith(1, 3, validBody.contenido);
  });

  it('should return remitente_id equal to authenticated tutor ID', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (insertMessage as jest.Mock).mockResolvedValue(mockInsertedMessage);

    const res = await request(app)
      .post('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.body.data.remitente_id).toBe(3);
  });

  it('should return leido false for new message', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (insertMessage as jest.Mock).mockResolvedValue(mockInsertedMessage);

    const res = await request(app)
      .post('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.body.data.leido).toBe(false);
  });

  it('should return 404 for unauthorized chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 99 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/movil/tutor/chats/99/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Chat not found');
  });

  it('should return 404 for nonexistent chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/movil/tutor/chats/999/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Chat not found');
  });

  it('should return 400 for invalid chat_id', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats/abc/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.status).toBe(400);
  });

  it('should return 400 for empty contenido', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ contenido: '' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for whitespace-only contenido', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ contenido: '   ' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for contenido over 2000 characters', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ contenido: 'x'.repeat(2001) });

    expect(res.status).toBe(400);
  });

  it('should return 403 for docente role', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${docenteToken}`)
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it('should return 403 for admin role', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats/1/mensajes')
      .send(validBody);

    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/chats/1/mensajes')
      .set('Authorization', 'Bearer invalidtoken')
      .send(validBody);

    expect(res.status).toBe(401);
  });
});

// ─── Transaction Model Tests ───────────────────────────────────────────────────

describe('createOrReuseChatTransaction', () => {
  // Use the real implementation (not the mock) for transaction tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let realCreateOrReuseChatTransaction: (...args: any[]) => Promise<any>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pool: any;
  let client: {
    query: jest.Mock;
    release: jest.Mock;
  };

  beforeAll(() => {
    const actualModule = jest.requireActual('../src/models/mobile-messaging.model');
    realCreateOrReuseChatTransaction = actualModule.createOrReuseChatTransaction;
  });

  beforeEach(() => {
    pool = mockPool;
    client = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(client);
  });

  it('should call BEGIN on new transaction', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // INSERT chat returns row (new)
      .mockResolvedValueOnce(undefined) // INSERT tutor participant
      .mockResolvedValueOnce(undefined) // INSERT teacher participant
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // INSERT message
      .mockResolvedValueOnce(undefined); // COMMIT

    await realCreateOrReuseChatTransaction(3, 5, 12, 1, 'Hello');

    expect(client.query).toHaveBeenCalledWith('BEGIN');
  });

  it('should call COMMIT on success', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // INSERT chat returns row (new)
      .mockResolvedValueOnce(undefined) // INSERT tutor participant
      .mockResolvedValueOnce(undefined) // INSERT teacher participant
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // INSERT message
      .mockResolvedValueOnce(undefined); // COMMIT

    await realCreateOrReuseChatTransaction(3, 5, 12, 1, 'Hello');

    expect(client.query).toHaveBeenCalledWith('COMMIT');
  });

  it('should NOT call ROLLBACK on success', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // INSERT chat returns row (new)
      .mockResolvedValueOnce(undefined) // INSERT tutor participant
      .mockResolvedValueOnce(undefined) // INSERT teacher participant
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // INSERT message
      .mockResolvedValueOnce(undefined); // COMMIT

    await realCreateOrReuseChatTransaction(3, 5, 12, 1, 'Hello');

    expect(client.query).not.toHaveBeenCalledWith('ROLLBACK');
  });

  it('should call ROLLBACK on failure', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error('DB error')); // INSERT chat fails

    await expect(
      realCreateOrReuseChatTransaction(3, 5, 12, 1, 'Hello'),
    ).rejects.toThrow('DB error');

    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should call client.release on success', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // INSERT chat returns row (new)
      .mockResolvedValueOnce(undefined) // INSERT tutor participant
      .mockResolvedValueOnce(undefined) // INSERT teacher participant
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // INSERT message
      .mockResolvedValueOnce(undefined); // COMMIT

    await realCreateOrReuseChatTransaction(3, 5, 12, 1, 'Hello');

    expect(client.release).toHaveBeenCalled();
  });

  it('should call client.release on failure', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error('DB error')); // INSERT chat fails

    await expect(
      realCreateOrReuseChatTransaction(3, 5, 12, 1, 'Hello'),
    ).rejects.toThrow('DB error');

    expect(client.release).toHaveBeenCalled();
  });

  it('should reuse existing chat after ON CONFLICT DO NOTHING', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // INSERT chat returns no rows (conflict)
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // SELECT existing chat
      .mockResolvedValueOnce(undefined) // INSERT tutor participant
      .mockResolvedValueOnce(undefined) // INSERT teacher participant
      .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // INSERT message
      .mockResolvedValueOnce(undefined); // COMMIT

    const result = await realCreateOrReuseChatTransaction(3, 5, 12, 1, 'Hello');

    expect(result.chat_id).toBe(5);
    expect(result.chat_creado).toBe(false);
  });

  it('should insert participants with ON CONFLICT DO NOTHING', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // INSERT chat returns row (new)
      .mockResolvedValueOnce(undefined) // INSERT tutor participant
      .mockResolvedValueOnce(undefined) // INSERT teacher participant
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // INSERT message
      .mockResolvedValueOnce(undefined); // COMMIT

    await realCreateOrReuseChatTransaction(3, 5, 12, 1, 'Hello');

    // Check that participants were inserted with ON CONFLICT
    const tutorParticipantCall = client.query.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' &&
        call[0].includes('chat_participantes') &&
        (call[1] as unknown[])?.[1] === 3,
    );
    expect(tutorParticipantCall).toBeDefined();
    expect((tutorParticipantCall as unknown[])[0] as string).toContain('ON CONFLICT');
  });

  it('should insert initial message with correct sender and leido=false', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // INSERT chat returns row (new)
      .mockResolvedValueOnce(undefined) // INSERT tutor participant
      .mockResolvedValueOnce(undefined) // INSERT teacher participant
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // INSERT message
      .mockResolvedValueOnce(undefined); // COMMIT

    await realCreateOrReuseChatTransaction(3, 5, 12, 1, 'Test message');

    // Find INSERT mensajes call
    const msgInsertCall = client.query.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO mensajes'),
    );
    expect(msgInsertCall).toBeDefined();
    expect((msgInsertCall as unknown[])[1]).toEqual([10, 3, 'Test message']);
    expect((msgInsertCall as unknown[])[0] as string).toContain('false'); // leido = false
  });
});
