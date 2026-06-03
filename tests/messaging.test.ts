import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/messaging.model', () => ({
  findChatsByParticipantId: jest.fn(),
  findAllChats: jest.fn(),
  findChatById: jest.fn(),
  userParticipatesInChat: jest.fn(),
  findMessagesByChatId: jest.fn(),
  countMessagesByChatId: jest.fn(),
  markIncomingMessagesAsRead: jest.fn(),
  insertMessage: jest.fn(),
}));

jest.mock('../src/db/connection', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    query: jest.fn(),
  },
}));

import app from '../src/app';
import { config } from '../src/config';
import {
  findChatsByParticipantId,
  findAllChats,
  findChatById,
  userParticipatesInChat,
  findMessagesByChatId,
  countMessagesByChatId,
  markIncomingMessagesAsRead,
  insertMessage,
} from '../src/models/messaging.model';

const mockInboxRows = [
  {
    chat_id: 1,
    tutor_id: 3,
    tutor_nombre: 'Carlos',
    tutor_apellido: 'García',
    alumno_id: 5,
    alumno_nombre: 'Mateo',
    alumno_apellido: 'Jaramillo',
    ultimo_mensaje: 'Hola Miss, quería preguntarle...',
    ultima_fecha: '2026-06-03T15:00:00.000Z',
    no_leidos: 2,
  },
  {
    chat_id: 2,
    tutor_id: 3,
    tutor_nombre: 'Carlos',
    tutor_apellido: 'García',
    alumno_id: 5,
    alumno_nombre: 'Mateo',
    alumno_apellido: 'Jaramillo',
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
  remitente_id: 1,
  contenido: 'Le comento que Mateo ha mostrado un excelente avance.',
  leido: false,
  fecha_envio: '2026-06-03T15:01:00.000Z',
};

function createToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, config.jwt.secret, {
    expiresIn: '8h',
  } as jwt.SignOptions);
}

const teacherToken = createToken(1, 'docente');
const adminToken = createToken(2, 'admin');
const tutorToken = createToken(3, 'tutor');

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Inbox ────────────────────────────────────────────────────────────────────

describe('GET /api/web/docente/chats', () => {
  it('should return 200 with teacher chats', async () => {
    (findChatsByParticipantId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/web/docente/chats')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      chat_id: 1,
      tutor: { tutor_id: 3, nombre: 'Carlos', apellido: 'García' },
      alumno: { alumno_id: 5, nombre: 'Mateo', apellido: 'Jaramillo' },
      ultimo_mensaje: 'Hola Miss, quería preguntarle...',
      no_leidos: 2,
    });
    expect(findChatsByParticipantId).toHaveBeenCalledWith(1);
  });

  it('should return 200 with all chats for admin', async () => {
    (findAllChats as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/web/docente/chats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(findAllChats).toHaveBeenCalledWith();
  });

  it('should return 403 for tutor', async () => {
    const res = await request(app)
      .get('/api/web/docente/chats')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/web/docente/chats');

    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/web/docente/chats')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
  });

  it('should include latest message text and timestamp in response', async () => {
    (findChatsByParticipantId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/web/docente/chats')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.body.data[0].ultimo_mensaje).toBe('Hola Miss, quería preguntarle...');
    expect(res.body.data[0].ultima_fecha).toBe('2026-06-03T15:00:00.000Z');
  });

  it('should return correct no_leidos count for teacher', async () => {
    (findChatsByParticipantId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/web/docente/chats')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.body.data[0].no_leidos).toBe(2);
  });

  it('should return null latest message and 0 unread for empty chat', async () => {
    (findChatsByParticipantId as jest.Mock).mockResolvedValue(mockInboxRows);

    const res = await request(app)
      .get('/api/web/docente/chats')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.body.data[1].ultimo_mensaje).toBeNull();
    expect(res.body.data[1].ultima_fecha).toBeNull();
    expect(res.body.data[1].no_leidos).toBe(0);
  });

  it('should return no_leidos 0 for admin', async () => {
    const adminRows = mockInboxRows.map((row) => ({ ...row, no_leidos: 0 }));
    (findAllChats as jest.Mock).mockResolvedValue(adminRows);

    const res = await request(app)
      .get('/api/web/docente/chats')
      .set('Authorization', `Bearer ${adminToken}`);

    for (const chat of res.body.data) {
      expect(chat.no_leidos).toBe(0);
    }
  });
});

// ─── Read Messages ────────────────────────────────────────────────────────────

describe('GET /api/web/docente/chats/:chat_id/mensajes', () => {
  it('should return 200 with paginated messages for authorized teacher', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (findMessagesByChatId as jest.Mock).mockResolvedValue(mockMessages);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(2);

    const res = await request(app)
      .get('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`);

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
      .get('/api/web/docente/chats/99/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Chat not found');
  });

  it('should return 200 for admin on any existing chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (findMessagesByChatId as jest.Mock).mockResolvedValue(mockMessages);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(2);

    const res = await request(app)
      .get('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(userParticipatesInChat).not.toHaveBeenCalled();
    expect(markIncomingMessagesAsRead).not.toHaveBeenCalled();
  });

  it('should return 404 for admin on nonexistent chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/web/docente/chats/999/mensajes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Chat not found');
  });

  it('should return 400 for invalid chat_id', async () => {
    const res = await request(app)
      .get('/api/web/docente/chats/abc/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(400);
  });

  it('should use default page=1 and limit=20 when omitted', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (findMessagesByChatId as jest.Mock).mockResolvedValue(mockMessages);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(2);

    const res = await request(app)
      .get('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(20);
  });

  it('should return 400 for invalid page', async () => {
    const res = await request(app)
      .get('/api/web/docente/chats/1/mensajes?page=0')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for limit over 100', async () => {
    const res = await request(app)
      .get('/api/web/docente/chats/1/mensajes?limit=200')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(400);
  });

  it('should include pagination metadata at top level', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (findMessagesByChatId as jest.Mock).mockResolvedValue(mockMessages);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(10);

    const res = await request(app)
      .get('/api/web/docente/chats/1/mensajes?page=2&limit=3')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.body.pagination).toEqual({
      page: 2,
      limit: 3,
      total: 10,
      total_pages: 4,
    });
  });

  it('should call markIncomingMessagesAsRead after authorization for teacher', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (findMessagesByChatId as jest.Mock).mockResolvedValue(mockMessages);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(2);

    await request(app)
      .get('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(markIncomingMessagesAsRead).toHaveBeenCalledWith(1, 1);
  });

  it('should not call markIncomingMessagesAsRead for unauthorized teacher', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 99 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(false);

    await request(app)
      .get('/api/web/docente/chats/99/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(markIncomingMessagesAsRead).not.toHaveBeenCalled();
  });

  it('should not call markIncomingMessagesAsRead for admin', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (findMessagesByChatId as jest.Mock).mockResolvedValue(mockMessages);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(2);

    await request(app)
      .get('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(markIncomingMessagesAsRead).not.toHaveBeenCalled();
  });

  it('should return empty data array for chat with no messages', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 3 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (findMessagesByChatId as jest.Mock).mockResolvedValue([]);
    (countMessagesByChatId as jest.Mock).mockResolvedValue(0);

    const res = await request(app)
      .get('/api/web/docente/chats/3/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
    expect(res.body.pagination.total_pages).toBe(0);
  });

  it('should return 403 for tutor', async () => {
    const res = await request(app)
      .get('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/web/docente/chats/1/mensajes');

    expect(res.status).toBe(401);
  });
});

// ─── Send Message ─────────────────────────────────────────────────────────────

describe('POST /api/web/docente/chats/:chat_id/mensajes', () => {
  const validBody = {
    contenido: 'Le comento que Mateo ha mostrado un excelente avance.',
  };

  it('should return 201 for teacher sending to authorized chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (insertMessage as jest.Mock).mockResolvedValue(mockInsertedMessage);

    const res = await request(app)
      .post('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toMatchObject({
      mensaje_id: 102,
      remitente_id: 1,
      contenido: 'Le comento que Mateo ha mostrado un excelente avance.',
      leido: false,
    });
    expect(insertMessage).toHaveBeenCalledWith(1, 1, validBody.contenido);
  });

  it('should return remitente_id equal to authenticated teacher', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (insertMessage as jest.Mock).mockResolvedValue(mockInsertedMessage);

    const res = await request(app)
      .post('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.body.data.remitente_id).toBe(1);
  });

  it('should return leido false for new message', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(true);
    (insertMessage as jest.Mock).mockResolvedValue(mockInsertedMessage);

    const res = await request(app)
      .post('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.body.data.leido).toBe(false);
  });

  it('should return 404 for teacher sending to unauthorized chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 99 });
    (userParticipatesInChat as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/web/docente/chats/99/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Chat not found');
  });

  it('should return 201 for admin sending to any existing chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue({ id: 1 });
    (insertMessage as jest.Mock).mockResolvedValue({
      ...mockInsertedMessage,
      remitente_id: 2,
    });

    const res = await request(app)
      .post('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data.remitente_id).toBe(2);
    expect(userParticipatesInChat).not.toHaveBeenCalled();
  });

  it('should return 404 for admin sending to nonexistent chat', async () => {
    (findChatById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/web/docente/chats/999/mensajes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Chat not found');
  });

  it('should return 400 for empty contenido', async () => {
    const res = await request(app)
      .post('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ contenido: '' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for whitespace-only contenido', async () => {
    const res = await request(app)
      .post('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ contenido: '   ' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for contenido over 2000 characters', async () => {
    const res = await request(app)
      .post('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ contenido: 'x'.repeat(2001) });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid chat_id', async () => {
    const res = await request(app)
      .post('/api/web/docente/chats/abc/mensajes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.status).toBe(400);
  });

  it('should return 403 for tutor', async () => {
    const res = await request(app)
      .post('/api/web/docente/chats/1/mensajes')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/web/docente/chats/1/mensajes')
      .send(validBody);

    expect(res.status).toBe(401);
  });
});
