import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/grades.model', () => ({
  findAssignmentById: jest.fn(),
  teacherOwnsAssignment: jest.fn(),
  findStudentById: jest.fn(),
  teacherHasStudentInAssignment: jest.fn(),
  studentBelongsToAssignmentGroup: jest.fn(),
  findGradesForStudent: jest.fn(),
  findGradeTable: jest.fn(),
  upsertGrade: jest.fn(),
  validateStudentsBelongToAssignment: jest.fn(),
  upsertGradesBulkTransaction: jest.fn(),
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
import pool from '../src/db/connection';
import {
  findAssignmentById,
  teacherOwnsAssignment,
  findStudentById,
  teacherHasStudentInAssignment,
  studentBelongsToAssignmentGroup,
  findGradesForStudent,
  findGradeTable,
  upsertGrade,
  validateStudentsBelongToAssignment,
  upsertGradesBulkTransaction,
} from '../src/models/grades.model';

const mockAssignment = {
  id: 10,
  docente_id: 1,
  grupo_id: 5,
  materia_id: 3,
};

const mockStudent = {
  id: 100,
  nombre: 'Mateo',
  apellido: 'Jaramillo',
  grupo_id: 5,
  foto_url: null,
};

const mockGradeRows = [
  {
    calificacion_id: 88,
    asignacion_id: 10,
    materia: 'Matemáticas',
    periodo: 'primer trimestre',
    calificacion: '9.5',
    comentario: 'Excelente',
    fecha_registro: '2026-06-03T10:30:00.000Z',
  },
];

const mockGradeTableRows = [
  {
    alumno_id: 100,
    nombre: 'Mateo',
    apellido: 'Jaramillo',
    foto_url: null,
    calificacion_id: 88,
    calificacion: '9.5',
    comentario: 'Excelente',
    fecha_registro: '2026-06-03T10:30:00.000Z',
  },
  {
    alumno_id: 101,
    nombre: 'Sofía',
    apellido: 'López',
    foto_url: null,
    calificacion_id: null,
    calificacion: null,
    comentario: null,
    fecha_registro: null,
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/web/docente/alumnos/:alumno_id/calificaciones', () => {
  it('should return 200 with grade history for authorized teacher', async () => {
    (findStudentById as jest.Mock).mockResolvedValue(mockStudent);
    (teacherHasStudentInAssignment as jest.Mock).mockResolvedValue(true);
    (findGradesForStudent as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/web/docente/alumnos/100/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      calificacion_id: 88,
      asignacion_id: 10,
      materia: 'Matemáticas',
      periodo: 'primer trimestre',
      nota: 9.5,
      comentario: 'Excelente',
    });
    expect(teacherHasStudentInAssignment).toHaveBeenCalledWith(1, 100);
    expect(findGradesForStudent).toHaveBeenCalledWith(100, 1);
  });

  it('should return 404 for unauthorized teacher-student relationship', async () => {
    (findStudentById as jest.Mock).mockResolvedValue(mockStudent);
    (teacherHasStudentInAssignment as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .get('/api/web/docente/alumnos/999/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Student not found');
  });

  it('should return 200 with all grades for admin', async () => {
    (findStudentById as jest.Mock).mockResolvedValue(mockStudent);
    (findGradesForStudent as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/web/docente/alumnos/100/calificaciones')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(1);
    expect(findGradesForStudent).toHaveBeenCalledWith(100);
  });

  it('should return 404 when student does not exist', async () => {
    (findStudentById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/web/docente/alumnos/999/calificaciones')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Student not found');
  });

  it('should return 200 with empty data when student has no grades', async () => {
    (findStudentById as jest.Mock).mockResolvedValue(mockStudent);
    (teacherHasStudentInAssignment as jest.Mock).mockResolvedValue(true);
    (findGradesForStudent as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/web/docente/alumnos/100/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return 400 for invalid alumno_id', async () => {
    const res = await request(app)
      .get('/api/web/docente/alumnos/abc/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 403 for tutor', async () => {
    const res = await request(app)
      .get('/api/web/docente/alumnos/100/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/web/docente/alumnos/100/calificaciones');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/web/docente/asignaciones/:asignacion_id/calificaciones', () => {
  it('should return 200 with grade table for teacher own assignment', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(true);
    (findGradeTable as jest.Mock).mockResolvedValue(mockGradeTableRows);

    const res = await request(app)
      .get('/api/web/docente/asignaciones/10/calificaciones?periodo=primer%20trimestre')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      alumno: { alumno_id: 100, nombre: 'Mateo', apellido: 'Jaramillo', foto_url: null },
      calificacion: { calificacion_id: 88, nota: 9.5, comentario: 'Excelente' },
    });
  });

  it('should return student with calificacion: null when no grade exists', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(true);
    (findGradeTable as jest.Mock).mockResolvedValue(mockGradeTableRows);

    const res = await request(app)
      .get('/api/web/docente/asignaciones/10/calificaciones?periodo=primer%20trimestre')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.body.data[1].calificacion).toBeNull();
    expect(res.body.data[1].alumno.alumno_id).toBe(101);
  });

  it('should return 404 for unauthorized teacher assignment', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .get('/api/web/docente/asignaciones/99/calificaciones?periodo=primer%20trimestre')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Assignment not found');
  });

  it('should return 200 for admin accessing any existing assignment', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (findGradeTable as jest.Mock).mockResolvedValue(mockGradeTableRows);

    const res = await request(app)
      .get('/api/web/docente/asignaciones/10/calificaciones?periodo=primer%20trimestre')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('should return 400 for invalid asignacion_id', async () => {
    const res = await request(app)
      .get('/api/web/docente/asignaciones/abc/calificaciones?periodo=primer%20trimestre')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for missing periodo query', async () => {
    const res = await request(app)
      .get('/api/web/docente/asignaciones/10/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid periodo value', async () => {
    const res = await request(app)
      .get('/api/web/docente/asignaciones/10/calificaciones?periodo=invalid')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 403 for tutor', async () => {
    const res = await request(app)
      .get('/api/web/docente/asignaciones/10/calificaciones?periodo=primer%20trimestre')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/web/docente/calificaciones', () => {
  const validBody = {
    alumno_id: 100,
    asignacion_id: 10,
    periodo: 'primer trimestre',
    nota: 8.5,
    comentario: 'Buen trabajo',
  };

  it('should return 200 for teacher inserting grade into own assignment', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(true);
    (studentBelongsToAssignmentGroup as jest.Mock).mockResolvedValue(true);
    (upsertGrade as jest.Mock).mockResolvedValue(45);

    const res = await request(app)
      .post('/api/web/docente/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toEqual({
      message: 'Calificación registrada con éxito',
      calificacion_id: 45,
    });
  });

  it('should return 200 for teacher updating existing grade', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(true);
    (studentBelongsToAssignmentGroup as jest.Mock).mockResolvedValue(true);
    (upsertGrade as jest.Mock).mockResolvedValue(45);

    const res = await request(app)
      .post('/api/web/docente/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, nota: 9.0 });

    expect(res.status).toBe(200);
    expect(res.body.data.calificacion_id).toBe(45);
  });

  it('should return 200 for admin upserting grade on any assignment', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (studentBelongsToAssignmentGroup as jest.Mock).mockResolvedValue(true);
    (upsertGrade as jest.Mock).mockResolvedValue(46);

    const res = await request(app)
      .post('/api/web/docente/calificaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.data.calificacion_id).toBe(46);
  });

  it('should return 400 for nota below 0', async () => {
    const res = await request(app)
      .post('/api/web/docente/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, nota: -1 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for nota above 10', async () => {
    const res = await request(app)
      .post('/api/web/docente/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, nota: 10.1 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid periodo', async () => {
    const res = await request(app)
      .post('/api/web/docente/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, periodo: 'Trimestre 1' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for comment over 500 characters', async () => {
    const res = await request(app)
      .post('/api/web/docente/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...validBody, comentario: 'x'.repeat(501) });

    expect(res.status).toBe(400);
  });

  it('should return 404 for student outside assignment group', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(true);
    (studentBelongsToAssignmentGroup as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/web/docente/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Student not found');
  });

  it('should return 404 for unauthorized assignment', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/web/docente/calificaciones')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Assignment not found');
  });

  it('should return 403 for tutor', async () => {
    const res = await request(app)
      .post('/api/web/docente/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBody);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/web/docente/calificaciones/bulk', () => {
  const validBulkBody = {
    asignacion_id: 10,
    periodo: 'primer trimestre',
    calificaciones: [
      { alumno_id: 100, nota: 8.5, comentario: 'Buen trabajo' },
      { alumno_id: 101, nota: 9.2, comentario: null },
    ],
  };

  it('should return 200 for teacher saving multiple valid grades', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(true);

    const mockClient = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    (validateStudentsBelongToAssignment as jest.Mock).mockResolvedValue(true);
    (upsertGradesBulkTransaction as jest.Mock).mockResolvedValue(2);

    const res = await request(app)
      .post('/api/web/docente/calificaciones/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBulkBody);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toEqual({
      message: 'Calificaciones registradas con éxito',
      actualizadas: 2,
    });
  });

  it('should report actualizadas count in response', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(true);

    const mockClient = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    (validateStudentsBelongToAssignment as jest.Mock).mockResolvedValue(true);
    (upsertGradesBulkTransaction as jest.Mock).mockResolvedValue(2);

    const res = await request(app)
      .post('/api/web/docente/calificaciones/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBulkBody);

    expect(res.body.data.actualizadas).toBe(2);
  });

  it('should return 400 for duplicate alumno_id in request', async () => {
    const res = await request(app)
      .post('/api/web/docente/calificaciones/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        asignacion_id: 10,
        periodo: 'primer trimestre',
        calificaciones: [
          { alumno_id: 100, nota: 8.5, comentario: null },
          { alumno_id: 100, nota: 9.0, comentario: null },
        ],
      });

    expect(res.status).toBe(400);
  });

  it('should return 400 for empty calificaciones array', async () => {
    const res = await request(app)
      .post('/api/web/docente/calificaciones/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        asignacion_id: 10,
        periodo: 'primer trimestre',
        calificaciones: [],
      });

    expect(res.status).toBe(400);
  });

  it('should return 400 for more than 100 records', async () => {
    const calificaciones = Array.from({ length: 101 }, (_, i) => ({
      alumno_id: i + 1,
      nota: 5.0,
      comentario: null,
    }));

    const res = await request(app)
      .post('/api/web/docente/calificaciones/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        asignacion_id: 10,
        periodo: 'primer trimestre',
        calificaciones,
      });

    expect(res.status).toBe(400);
  });

  it('should return 404 for student outside assignment group', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(true);

    const mockClient = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValueOnce({}); // BEGIN

    (validateStudentsBelongToAssignment as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/web/docente/calificaciones/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBulkBody);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Student not found');
  });

  it('should return 404 for unauthorized assignment', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/web/docente/calificaciones/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBulkBody);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Assignment not found');
  });

  it('should return 400 for invalid nota in one item', async () => {
    const res = await request(app)
      .post('/api/web/docente/calificaciones/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        asignacion_id: 10,
        periodo: 'primer trimestre',
        calificaciones: [
          { alumno_id: 100, nota: 15, comentario: null },
        ],
      });

    expect(res.status).toBe(400);
  });

  it('should return 403 for tutor', async () => {
    const res = await request(app)
      .post('/api/web/docente/calificaciones/bulk')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send(validBulkBody);

    expect(res.status).toBe(403);
  });
});

describe('Bulk upsert transaction behavior', () => {
  const validBulkBody = {
    asignacion_id: 10,
    periodo: 'primer trimestre',
    calificaciones: [
      { alumno_id: 100, nota: 8.5, comentario: null },
    ],
  };

  it('should call BEGIN, COMMIT, and release on success', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(true);

    const mockClient = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    (validateStudentsBelongToAssignment as jest.Mock).mockResolvedValue(true);
    (upsertGradesBulkTransaction as jest.Mock).mockResolvedValue(1);

    await request(app)
      .post('/api/web/docente/calificaciones/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBulkBody);

    const queryCalls = mockClient.query.mock.calls.map((c: unknown[]) => c[0]);
    expect(queryCalls).toContain('BEGIN');
    expect(queryCalls).toContain('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should call BEGIN, ROLLBACK, and release on upsert failure', async () => {
    (findAssignmentById as jest.Mock).mockResolvedValue(mockAssignment);
    (teacherOwnsAssignment as jest.Mock).mockResolvedValue(true);

    const mockClient = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    (validateStudentsBelongToAssignment as jest.Mock).mockResolvedValue(true);
    (upsertGradesBulkTransaction as jest.Mock).mockRejectedValue(
      new Error('DB error'),
    );

    const res = await request(app)
      .post('/api/web/docente/calificaciones/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(validBulkBody);

    expect(res.status).toBe(500);

    const queryCalls = mockClient.query.mock.calls.map((c: unknown[]) => c[0]);
    expect(queryCalls).toContain('BEGIN');
    expect(queryCalls).toContain('ROLLBACK');
    expect(queryCalls).not.toContain('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
