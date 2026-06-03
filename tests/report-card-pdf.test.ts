import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/report-card.model', () => ({
  findChildByTutorAndStudentId: jest.fn(),
  findConsolidatedGradesByStudentAndGroupId: jest.fn(),
  findSignaturesByTutorAndStudentId: jest.fn(),
  upsertReportCardSignature: jest.fn(),
  countGradesForStudentAndPeriod: jest.fn(),
}));

import app from '../src/app';
import { config } from '../src/config';
import {
  findChildByTutorAndStudentId,
  findConsolidatedGradesByStudentAndGroupId,
  findSignaturesByTutorAndStudentId,
} from '../src/models/report-card.model';

const mockChildMateo = {
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
};

const mockGradeRows = [
  {
    asignacion_id: 12,
    materia_id: 1,
    nombre_materia: 'Matemáticas',
    docente_id: 1,
    docente_nombre: 'Ana',
    docente_apellido: 'López',
    periodo: 'primer trimestre',
    calificacion: '9.5',
    comentario: 'Excelente',
    fecha_registro: '2026-06-03T10:30:00.000Z',
  },
  {
    asignacion_id: 12,
    materia_id: 1,
    nombre_materia: 'Matemáticas',
    docente_id: 1,
    docente_nombre: 'Ana',
    docente_apellido: 'López',
    periodo: 'segundo trimestre',
    calificacion: null,
    comentario: null,
    fecha_registro: null,
  },
  {
    asignacion_id: 12,
    materia_id: 1,
    nombre_materia: 'Matemáticas',
    docente_id: 1,
    docente_nombre: 'Ana',
    docente_apellido: 'López',
    periodo: 'tercer trimestre',
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

const tutorToken = createToken(3, 'tutor');
const docenteToken = createToken(1, 'docente');
const adminToken = createToken(2, 'admin');

beforeEach(() => {
  jest.clearAllMocks();
  (findSignaturesByTutorAndStudentId as jest.Mock).mockResolvedValue([]);
});

describe('GET /api/movil/tutor/hijos/:alumno_id/calificaciones/pdf', () => {
  it('should return 200 with PDF for linked child', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
  });

  it('should set Content-Type to application/pdf', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.headers['content-type']).toBe('application/pdf');
  });

  it('should set Content-Disposition with safe filename', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.headers['content-disposition']).toMatch(/^attachment; filename="boleta-mateo-jaramillo\.pdf"$/);
  });

  it('should set Content-Length', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.headers).toHaveProperty('content-length');
    expect(Number(res.headers['content-length'])).toBeGreaterThan(0);
  });

  it('should return binary buffer', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  it('should return 404 for unlinked student', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/999/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Student not found');
  });

  it('should return same 404 for nonexistent student', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/99999/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Student not found');
  });

  it('should return 400 for invalid alumno_id string', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/abc/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for alumno_id zero', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/0/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for negative alumno_id', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/-1/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 403 for docente role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', `Bearer ${docenteToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 403 for admin role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 without Authorization header', async () => {
    const res = await request(app).get('/api/movil/tutor/hijos/5/calificaciones/pdf');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('should work when no trimester has been signed', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);
    (findSignaturesByTutorAndStudentId as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });
});

describe('PDF service unit test (real PDF generation)', () => {
  it('should generate a buffer starting with %PDF', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.slice(0, 4).toString()).toBe('%PDF');
  });

  it('should generate non-zero length buffer', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should generate safe filename for names with accents', async () => {
    const childWithAccents = {
      ...mockChildMateo,
      nombre: 'María',
      apellido: 'José Pérez',
    };

    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(childWithAccents);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones/pdf')
      .set('Authorization', `Bearer ${tutorToken}`);

    const disposition = res.headers['content-disposition'];
    expect(disposition).toMatch(/^attachment; filename="boleta-maria-jose-perez\.pdf"$/);
  });
});
