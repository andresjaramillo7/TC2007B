import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/announcements.model', () => ({
  findAnnouncementsBySenderId: jest.fn(),
  findAllAnnouncements: jest.fn(),
  insertAnnouncement: jest.fn(),
}));

jest.mock('../src/models/academic.model', () => ({
  findGroupById: jest.fn(),
  teacherHasAccessToGroup: jest.fn(),
}));

import app from '../src/app';
import { config } from '../src/config';
import {
  findAnnouncementsBySenderId,
  findAllAnnouncements,
  insertAnnouncement,
} from '../src/models/announcements.model';
import {
  findGroupById,
  teacherHasAccessToGroup,
} from '../src/models/academic.model';

const mockAnnouncements = [
  {
    aviso_id: 3,
    grupo_id: 1,
    grupo_nombre: "1° A",
    remitente_usuario_id: 1,
    remitente_nombre: "Ana",
    remitente_apellido: "López",
    remitente_rol: "docente",
    titulo: "Material para mañana",
    contenido: "Traer geometría y regla.",
    fecha_publicacion: "2026-06-03T15:00:00.000Z",
  },
  {
    aviso_id: 2,
    grupo_id: 2,
    grupo_nombre: "2° B",
    remitente_usuario_id: 1,
    remitente_nombre: "Ana",
    remitente_apellido: "López",
    remitente_rol: "docente",
    titulo: "Actividad de ciencias",
    contenido: "Preparar exposición.",
    fecha_publicacion: "2026-06-02T10:00:00.000Z",
  },
];

const mockAllAnnouncements = [
  ...mockAnnouncements,
  {
    aviso_id: 1,
    grupo_id: 3,
    grupo_nombre: "3° C",
    remitente_usuario_id: 4,
    remitente_nombre: "María",
    remitente_apellido: "Administrador",
    remitente_rol: "admin",
    titulo: "Aviso administrativo",
    contenido: "Reunión general.",
    fecha_publicacion: "2026-06-01T09:00:00.000Z",
  },
];

function createToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, config.jwt.secret, {
    expiresIn: '8h',
  } as jwt.SignOptions);
}

const teacherToken = createToken(1, 'docente');
const adminToken = createToken(2, 'admin');
const tutorToken = createToken(3, 'tutor');

const mockGroup = {
  id: 1,
  grado: 1,
  grupo_letra: 'A',
  ciclo_escolar: '2026-2027',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/web/docente/avisos', () => {
  it('should return 200 with own announcements for docente role', async () => {
    (findAnnouncementsBySenderId as jest.Mock).mockResolvedValue(mockAnnouncements);

    const res = await request(app)
      .get('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      aviso_id: 3,
      grupo: { grupo_id: 1, nombre: '1° A' },
      remitente: { usuario_id: 1, nombre: 'Ana', apellido: 'López', rol: 'docente' },
      titulo: 'Material para mañana',
    });
    expect(findAnnouncementsBySenderId).toHaveBeenCalledWith(1);
  });

  it('should return 200 with all announcements for admin role', async () => {
    (findAllAnnouncements as jest.Mock).mockResolvedValue(mockAllAnnouncements);

    const res = await request(app)
      .get('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(3);
    expect(findAllAnnouncements).toHaveBeenCalled();
  });

  it('should return 403 for tutor role', async () => {
    const res = await request(app)
      .get('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 without Authorization header', async () => {
    const res = await request(app).get('/api/web/docente/avisos');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/web/docente/avisos')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('should return 200 with empty data when no announcements exist', async () => {
    (findAnnouncementsBySenderId as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should use snake_case in response fields', async () => {
    (findAnnouncementsBySenderId as jest.Mock).mockResolvedValue(mockAnnouncements);

    const res = await request(app)
      .get('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`);

    const item = res.body.data[0];
    expect(item).toHaveProperty('aviso_id');
    expect(item).toHaveProperty('grupo.grupo_id');
    expect(item).toHaveProperty('remitente.usuario_id');
    expect(item).toHaveProperty('fecha_publicacion');
    expect(item).not.toHaveProperty('avisoId');
    expect(item).not.toHaveProperty('fechaPublicacion');
  });

  it('should return announcements sorted newest first according to model contract', async () => {
    const sortedData = [
      { ...mockAnnouncements[0], aviso_id: 5 },
      { ...mockAnnouncements[0], aviso_id: 4 },
    ];
    (findAnnouncementsBySenderId as jest.Mock).mockResolvedValue(sortedData);

    const res = await request(app)
      .get('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.body.data[0].aviso_id).toBe(5);
    expect(res.body.data[1].aviso_id).toBe(4);
  });
});

describe('POST /api/web/docente/avisos', () => {
  const validBody = {
    grupo_id: 1,
    titulo: 'Material para mañana',
    contenido: 'Traer geometría y regla.',
  };

  it('should return 201 for docente publishing to authorized group', async () => {
    (teacherHasAccessToGroup as jest.Mock).mockResolvedValue(true);
    (insertAnnouncement as jest.Mock).mockResolvedValue(3);

    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toEqual({
      message: 'Aviso publicado',
      aviso_id: 3,
    });
    expect(teacherHasAccessToGroup).toHaveBeenCalledWith(1, 1);
    expect(insertAnnouncement).toHaveBeenCalledWith(1, 1, 'Material para mañana', 'Traer geometría y regla.');
  });

  it('should return 201 for admin publishing to existing group', async () => {
    (findGroupById as jest.Mock).mockResolvedValue(mockGroup);
    (insertAnnouncement as jest.Mock).mockResolvedValue(4);

    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data.aviso_id).toBe(4);
    expect(findGroupById).toHaveBeenCalledWith(1);
    expect(insertAnnouncement).toHaveBeenCalledWith(1, 2, 'Material para mañana', 'Traer geometría y regla.');
  });

  it('should return 404 for docente publishing to unauthorized group', async () => {
    (teacherHasAccessToGroup as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Group not found');
    expect(insertAnnouncement).not.toHaveBeenCalled();
  });

  it('should return 404 for admin publishing to nonexistent group', async () => {
    (findGroupById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBody, grupo_id: 999 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Group not found');
    expect(insertAnnouncement).not.toHaveBeenCalled();
  });

  it('should return 403 for tutor', async () => {
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 without Authorization header', async () => {
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .send(validBody);

    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', 'Bearer invalid-token')
      .send(validBody);

    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid grupo_id (string)', async () => {
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, grupo_id: 'abc' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid grupo_id (negative)', async () => {
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, grupo_id: -1 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for missing grupo_id', async () => {
    const bodyWithoutGrupo = { titulo: validBody.titulo, contenido: validBody.contenido };
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(bodyWithoutGrupo);

    expect(res.status).toBe(400);
  });

  it('should return 400 for empty titulo', async () => {
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, titulo: '' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for whitespace-only titulo', async () => {
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, titulo: '   ' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for titulo over 150 characters', async () => {
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, titulo: 'x'.repeat(151) });

    expect(res.status).toBe(400);
  });

  it('should return 400 for empty contenido', async () => {
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, contenido: '' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for whitespace-only contenido', async () => {
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, contenido: '   ' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for contenido over 3000 characters', async () => {
    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, contenido: 'x'.repeat(3001) });

    expect(res.status).toBe(400);
  });

  it('should insert with remitente_id equal to authenticated user ID', async () => {
    (teacherHasAccessToGroup as jest.Mock).mockResolvedValue(true);
    (insertAnnouncement as jest.Mock).mockResolvedValue(5);

    await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(insertAnnouncement).toHaveBeenCalledWith(
      expect.any(Number),
      1,
      expect.any(String),
      expect.any(String),
    );
  });

  it('should return aviso_id in response', async () => {
    (teacherHasAccessToGroup as jest.Mock).mockResolvedValue(true);
    (insertAnnouncement as jest.Mock).mockResolvedValue(7);

    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.body.data).toHaveProperty('aviso_id');
    expect(res.body.data.aviso_id).toBe(7);
  });

  it('should return message "Aviso publicado" in response', async () => {
    (teacherHasAccessToGroup as jest.Mock).mockResolvedValue(true);
    (insertAnnouncement as jest.Mock).mockResolvedValue(3);

    const res = await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.body.data.message).toBe('Aviso publicado');
  });

  it('should pass trimmed titulo and contenido to the model', async () => {
    (teacherHasAccessToGroup as jest.Mock).mockResolvedValue(true);
    (insertAnnouncement as jest.Mock).mockResolvedValue(3);

    await request(app)
      .post('/api/web/docente/avisos')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        grupo_id: 1,
        titulo: '  Material para mañana  ',
        contenido: '  Traer geometría y regla.  ',
      });

    expect(insertAnnouncement).toHaveBeenCalledWith(
      1,
      1,
      'Material para mañana',
      'Traer geometría y regla.',
    );
  });
});
