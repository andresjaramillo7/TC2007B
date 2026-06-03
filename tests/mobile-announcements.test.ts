import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/mobile-announcements.model', () => ({
  findAnnouncementsByTutorId: jest.fn(),
}));

import app from '../src/app';
import { config } from '../src/config';
import { findAnnouncementsByTutorId } from '../src/models/mobile-announcements.model';

const mockAnnouncements = [
  {
    aviso_id: 3,
    grupo_id: 1,
    grupo_nombre: "1° A",
    autor_usuario_id: 1,
    autor_nombre: "Ana",
    autor_apellido: "López",
    autor_rol: "docente",
    titulo: "Firma de boletas",
    contenido: "Favor de revisar y firmar la boleta del trimestre.",
    fecha_publicacion: "2026-06-03T15:00:00.000Z",
  },
  {
    aviso_id: 2,
    grupo_id: 1,
    grupo_nombre: "1° A",
    autor_usuario_id: 2,
    autor_nombre: "Pedro",
    autor_apellido: "Ruiz",
    autor_rol: "docente",
    titulo: "Lectura de historia",
    contenido: "Leer las páginas 20 a 25.",
    fecha_publicacion: "2026-06-02T10:00:00.000Z",
  },
];

function createToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, config.jwt.secret, {
    expiresIn: '8h',
  } as jwt.SignOptions);
}

const tutorToken = createToken(3, 'tutor');
const docenteToken = createToken(1, 'docente');
const adminToken = createToken(4, 'admin');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/movil/tutor/avisos', () => {
  it('should return 200 with announcements from linked children groups for tutor', async () => {
    (findAnnouncementsByTutorId as jest.Mock).mockResolvedValue(mockAnnouncements);

    const res = await request(app)
      .get('/api/movil/tutor/avisos')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      aviso_id: 3,
      grupo: { grupo_id: 1, nombre: '1° A' },
      autor: { usuario_id: 1, nombre: 'Ana', apellido: 'López', rol: 'docente' },
      titulo: 'Firma de boletas',
      contenido: 'Favor de revisar y firmar la boleta del trimestre.',
    });
    expect(findAnnouncementsByTutorId).toHaveBeenCalledWith(3);
  });

  it('should return snake_case fields in the response', async () => {
    (findAnnouncementsByTutorId as jest.Mock).mockResolvedValue(mockAnnouncements);

    const res = await request(app)
      .get('/api/movil/tutor/avisos')
      .set('Authorization', `Bearer ${tutorToken}`);

    const item = res.body.data[0];
    expect(item).toHaveProperty('aviso_id');
    expect(item).toHaveProperty('fecha_publicacion');
    expect(item).not.toHaveProperty('avisoId');
    expect(item).not.toHaveProperty('fechaPublicacion');
    expect(item.grupo).toHaveProperty('grupo_id');
    expect(item.autor).toHaveProperty('usuario_id');
  });

  it('should include nested grupo object', async () => {
    (findAnnouncementsByTutorId as jest.Mock).mockResolvedValue(mockAnnouncements);

    const res = await request(app)
      .get('/api/movil/tutor/avisos')
      .set('Authorization', `Bearer ${tutorToken}`);

    const item = res.body.data[0];
    expect(item.grupo).toBeDefined();
    expect(item.grupo.grupo_id).toBe(1);
    expect(item.grupo.nombre).toBe("1° A");
  });

  it('should include nested autor object', async () => {
    (findAnnouncementsByTutorId as jest.Mock).mockResolvedValue(mockAnnouncements);

    const res = await request(app)
      .get('/api/movil/tutor/avisos')
      .set('Authorization', `Bearer ${tutorToken}`);

    const item = res.body.data[0];
    expect(item.autor).toBeDefined();
    expect(item.autor.usuario_id).toBe(1);
    expect(item.autor.nombre).toBe('Ana');
    expect(item.autor.apellido).toBe('López');
    expect(item.autor.rol).toBe('docente');
  });

  it('should return announcements sorted newest first according to model contract', async () => {
    const sortedData = [
      { ...mockAnnouncements[0], aviso_id: 5 },
      { ...mockAnnouncements[0], aviso_id: 4 },
    ];
    (findAnnouncementsByTutorId as jest.Mock).mockResolvedValue(sortedData);

    const res = await request(app)
      .get('/api/movil/tutor/avisos')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data[0].aviso_id).toBe(5);
    expect(res.body.data[1].aviso_id).toBe(4);
  });

  it('should not duplicate announcement rows for duplicate linked-child groups (dedup at SQL level)', async () => {
    (findAnnouncementsByTutorId as jest.Mock).mockResolvedValue(mockAnnouncements);

    const res = await request(app)
      .get('/api/movil/tutor/avisos')
      .set('Authorization', `Bearer ${tutorToken}`);

    const ids = res.body.data.map((a: { aviso_id: number }) => a.aviso_id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should return 200 with empty data when tutor has linked children but no announcements', async () => {
    (findAnnouncementsByTutorId as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/movil/tutor/avisos')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return 200 with empty data when tutor has no linked children', async () => {
    (findAnnouncementsByTutorId as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/movil/tutor/avisos')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return 403 for docente role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/avisos')
      .set('Authorization', `Bearer ${docenteToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 403 for admin role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/avisos')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 without Authorization header', async () => {
    const res = await request(app).get('/api/movil/tutor/avisos');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/avisos')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });
});
