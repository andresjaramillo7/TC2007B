import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/academic.model', () => ({
  findAssignmentsByTeacherId: jest.fn(),
  findAllAssignments: jest.fn(),
  findGroupById: jest.fn(),
  teacherHasAccessToGroup: jest.fn(),
  findStudentsByGroupId: jest.fn(),
}));

import app from '../src/app';
import { config } from '../src/config';
import {
  findAssignmentsByTeacherId,
  findAllAssignments,
  findGroupById,
  teacherHasAccessToGroup,
  findStudentsByGroupId,
} from '../src/models/academic.model';

const mockAssignments = [
  {
    asignacion_id: 1,
    grupo_id: 1,
    grupo_nombre: "1° A",
    grado: 1,
    grupo_letra: "A",
    ciclo_escolar: "2026-2027",
    materia_id: 1,
    materia_nombre: "Matemáticas",
  },
  {
    asignacion_id: 2,
    grupo_id: 2,
    grupo_nombre: "2° B",
    grado: 2,
    grupo_letra: "B",
    ciclo_escolar: "2026-2027",
    materia_id: 2,
    materia_nombre: "Ciencias",
  },
];

const mockStudents = [
  { alumno_id: 1, nombre: "Mateo", apellido: "Jaramillo", foto_url: null },
  { alumno_id: 2, nombre: "Sofía", apellido: "Martínez", foto_url: null },
];

const mockGroup = {
  id: 1,
  grado: 1,
  grupo_letra: "A",
  ciclo_escolar: "2026-2027",
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

describe('GET /api/web/docente/asignaciones', () => {
  it('should return 200 with teacher assignments for docente role', async () => {
    (findAssignmentsByTeacherId as jest.Mock).mockResolvedValue(mockAssignments);

    const res = await request(app)
      .get('/api/web/docente/asignaciones')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      asignacion_id: 1,
      grupo: { grupo_id: 1, nombre: '1° A', grado: 1, grupo_letra: 'A', ciclo_escolar: '2026-2027' },
      materia: { materia_id: 1, nombre: 'Matemáticas' },
    });
    expect(findAssignmentsByTeacherId).toHaveBeenCalledWith(1);
  });

  it('should return 200 with all assignments for admin role', async () => {
    (findAllAssignments as jest.Mock).mockResolvedValue(mockAssignments);

    const res = await request(app)
      .get('/api/web/docente/asignaciones')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(findAllAssignments).toHaveBeenCalled();
  });

  it('should return 403 for tutor role', async () => {
    const res = await request(app)
      .get('/api/web/docente/asignaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 without Authorization header', async () => {
    const res = await request(app).get('/api/web/docente/asignaciones');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/web/docente/asignaciones')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('should return 200 with empty array when teacher has no assignments', async () => {
    (findAssignmentsByTeacherId as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/web/docente/asignaciones')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/web/docente/grupos/:grupo_id/alumnos', () => {
  it('should return 200 with students for authorized teacher', async () => {
    (teacherHasAccessToGroup as jest.Mock).mockResolvedValue(true);
    (findStudentsByGroupId as jest.Mock).mockResolvedValue(mockStudents);

    const res = await request(app)
      .get('/api/web/docente/grupos/1/alumnos')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      alumno_id: 1,
      nombre: 'Mateo',
      apellido: 'Jaramillo',
      foto_url: null,
    });
    expect(teacherHasAccessToGroup).toHaveBeenCalledWith(1, 1);
  });

  it('should return 404 when teacher accesses unauthorized group', async () => {
    (teacherHasAccessToGroup as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .get('/api/web/docente/grupos/99/alumnos')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Group not found');
  });

  it('should return 200 for admin accessing existing group', async () => {
    (findGroupById as jest.Mock).mockResolvedValue(mockGroup);
    (findStudentsByGroupId as jest.Mock).mockResolvedValue(mockStudents);

    const res = await request(app)
      .get('/api/web/docente/grupos/1/alumnos')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(findGroupById).toHaveBeenCalledWith(1);
  });

  it('should return 404 when admin accesses nonexistent group', async () => {
    (findGroupById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/web/docente/grupos/999/alumnos')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Group not found');
  });

  it('should return 400 for invalid group ID string', async () => {
    const res = await request(app)
      .get('/api/web/docente/grupos/abc/alumnos')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('fail');
  });

  it('should return 400 for group ID zero', async () => {
    const res = await request(app)
      .get('/api/web/docente/grupos/0/alumnos')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for negative group ID', async () => {
    const res = await request(app)
      .get('/api/web/docente/grupos/-1/alumnos')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 403 for tutor attempting access', async () => {
    const res = await request(app)
      .get('/api/web/docente/grupos/1/alumnos')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 200 with empty array when group has no students', async () => {
    (teacherHasAccessToGroup as jest.Mock).mockResolvedValue(true);
    (findStudentsByGroupId as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/web/docente/grupos/1/alumnos')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
