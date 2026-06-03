import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/children.model', () => ({
  findChildrenByTutorId: jest.fn(),
}));

import app from '../src/app';
import { config } from '../src/config';
import { findChildrenByTutorId } from '../src/models/children.model';

const mockChildren = [
  {
    alumno_id: 5,
    nombre: 'Mateo',
    apellido: 'Jaramillo',
    grupo_id: 1,
    grupo_nombre: "1° A",
    grado: 1,
    grupo_letra: 'A',
    ciclo_escolar: '2026-2027',
    foto_url: null,
    parentesco: 'padre',
  },
  {
    alumno_id: 6,
    nombre: 'Sofía',
    apellido: 'Martínez',
    grupo_id: 1,
    grupo_nombre: "1° A",
    grado: 1,
    grupo_letra: 'A',
    ciclo_escolar: '2026-2027',
    foto_url: null,
    parentesco: 'padre',
  },
];

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

describe('GET /api/movil/tutor/hijos', () => {
  it('should return 200 with linked children for tutor role', async () => {
    (findChildrenByTutorId as jest.Mock).mockResolvedValue(mockChildren);

    const res = await request(app)
      .get('/api/movil/tutor/hijos')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      alumno_id: 5,
      nombre: 'Mateo',
      apellido: 'Jaramillo',
      nombre_completo: 'Mateo Jaramillo',
      grupo: {
        grupo_id: 1,
        nombre: "1° A",
        grado: 1,
        grupo_letra: 'A',
        ciclo_escolar: '2026-2027',
      },
      foto_url: null,
      parentesco: 'padre',
    });
    expect(findChildrenByTutorId).toHaveBeenCalledWith(3);
  });

  it('should return snake_case fields in the response', async () => {
    (findChildrenByTutorId as jest.Mock).mockResolvedValue(mockChildren);

    const res = await request(app)
      .get('/api/movil/tutor/hijos')
      .set('Authorization', `Bearer ${tutorToken}`);

    const child = res.body.data[0];
    expect(child).toHaveProperty('alumno_id');
    expect(child).toHaveProperty('nombre_completo');
    expect(child).toHaveProperty('foto_url');
    expect(child.grupo).toHaveProperty('grupo_id');
    expect(child.grupo).toHaveProperty('grupo_letra');
    expect(child.grupo).toHaveProperty('ciclo_escolar');
  });

  it('should include nested group object', async () => {
    (findChildrenByTutorId as jest.Mock).mockResolvedValue(mockChildren);

    const res = await request(app)
      .get('/api/movil/tutor/hijos')
      .set('Authorization', `Bearer ${tutorToken}`);

    const child = res.body.data[0];
    expect(child.grupo).toBeDefined();
    expect(child.grupo.grupo_id).toBe(1);
    expect(child.grupo.nombre).toBe("1° A");
    expect(child.grupo.ciclo_escolar).toBe('2026-2027');
  });

  it('should return 200 with empty array when tutor has no children', async () => {
    (findChildrenByTutorId as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/movil/tutor/hijos')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return 403 for docente role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos')
      .set('Authorization', `Bearer ${docenteToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 403 for admin role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 without Authorization header', async () => {
    const res = await request(app).get('/api/movil/tutor/hijos');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });
});
