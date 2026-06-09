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
  upsertReportCardSignature,
  countGradesForStudentAndPeriod,
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

const mockUpsertResult = {
  firma_id: 1,
  alumno_id: 5,
  periodo: 'primer trimestre',
  fecha_firma: '2026-06-03T15:00:00.000Z',
};

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

describe('POST /api/movil/tutor/hijos/:alumno_id/boletas/:periodo/firma', () => {
  it('should return 200 when tutor signs linked child trimester', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(3);
    (upsertReportCardSignature as jest.Mock).mockResolvedValue(mockUpsertResult);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('message', 'Boleta firmada con éxito');
    expect(res.body.data).toHaveProperty('firma');
  });

  it('should return firma_id in response', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(3);
    (upsertReportCardSignature as jest.Mock).mockResolvedValue(mockUpsertResult);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.body.data.firma).toHaveProperty('firma_id');
    expect(res.body.data.firma.firma_id).toBe(1);
  });

  it('should return alumno_id in response', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(3);
    (upsertReportCardSignature as jest.Mock).mockResolvedValue(mockUpsertResult);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.body.data.firma).toHaveProperty('alumno_id');
    expect(res.body.data.firma.alumno_id).toBe(5);
  });

  it('should return periodo in response', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(3);
    (upsertReportCardSignature as jest.Mock).mockResolvedValue(mockUpsertResult);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.body.data.firma).toHaveProperty('periodo');
    expect(res.body.data.firma.periodo).toBe('primer trimestre');
  });

  it('should return fecha_firma in response', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(3);
    (upsertReportCardSignature as jest.Mock).mockResolvedValue(mockUpsertResult);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.body.data.firma).toHaveProperty('fecha_firma');
    expect(res.body.data.firma.fecha_firma).toBe('2026-06-03T15:00:00.000Z');
  });

  it('should accept empty body', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(3);
    (upsertReportCardSignature as jest.Mock).mockResolvedValue(mockUpsertResult);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.status).toBe(200);
  });

  it('should accept omitted body', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(3);
    (upsertReportCardSignature as jest.Mock).mockResolvedValue(mockUpsertResult);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
  });

  it('should return 400 for unexpected body fields', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(3);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ comentario: 'Unexpected field' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid periodo', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/invalido/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid alumno_id string', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/hijos/abc/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('should return 400 for alumno_id zero', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/hijos/0/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('should return 400 for negative alumno_id', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/hijos/-1/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('should return 404 for unlinked student', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/999/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Student not found');
  });

  it('should return same 404 for nonexistent student', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/99999/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Student not found');
  });

  it('should return 200 when period has at least one grade', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(1);
    (upsertReportCardSignature as jest.Mock).mockResolvedValue(mockUpsertResult);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.status).toBe(200);
  });

  it('should return 400 when period has zero grades', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(0);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Report card has no grades for this period');
  });

  it('should return 403 for docente role', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${docenteToken}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 403 for admin role', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 without Authorization header', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', 'Bearer invalid-token')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('should call upsert with authenticated tutor ID', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(3);
    (upsertReportCardSignature as jest.Mock).mockResolvedValue(mockUpsertResult);

    await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(upsertReportCardSignature).toHaveBeenCalledWith(3, 5, 'primer trimestre');
  });

  it('should idempotently update fecha_firma on duplicate signature', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(3);

    const firstResult = {
      firma_id: 1,
      alumno_id: 5,
      periodo: 'primer trimestre',
      fecha_firma: '2026-06-03T15:00:00.000Z',
    };
    const secondResult = {
      firma_id: 1,
      alumno_id: 5,
      periodo: 'primer trimestre',
      fecha_firma: '2026-06-08T10:00:00.000Z',
    };

    (upsertReportCardSignature as jest.Mock)
      .mockResolvedValueOnce(firstResult)
      .mockResolvedValueOnce(secondResult);

    const res1 = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});
    expect(res1.body.data.firma.fecha_firma).toBe('2026-06-03T15:00:00.000Z');

    const res2 = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});
    expect(res2.body.data.firma.fecha_firma).toBe('2026-06-08T10:00:00.000Z');

    expect(upsertReportCardSignature).toHaveBeenCalledTimes(2);
  });

  it('should not return comentario in response', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (countGradesForStudentAndPeriod as jest.Mock).mockResolvedValue(3);
    (upsertReportCardSignature as jest.Mock).mockResolvedValue(mockUpsertResult);

    const res = await request(app)
      .post('/api/movil/tutor/hijos/5/boletas/primer%20trimestre/firma')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({});

    expect(res.body.data.firma).not.toHaveProperty('comentario');
  });
});
