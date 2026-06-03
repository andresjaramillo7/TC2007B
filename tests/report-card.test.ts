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

const mockGradeRowsMultipleSubjects = [
  ...mockGradeRows,
  {
    asignacion_id: 13,
    materia_id: 2,
    nombre_materia: 'Historia',
    docente_id: 2,
    docente_nombre: 'Pedro',
    docente_apellido: 'Ruiz',
    periodo: 'primer trimestre',
    calificacion: '8.0',
    comentario: null,
    fecha_registro: '2026-06-03T11:00:00.000Z',
  },
  {
    asignacion_id: 13,
    materia_id: 2,
    nombre_materia: 'Historia',
    docente_id: 2,
    docente_nombre: 'Pedro',
    docente_apellido: 'Ruiz',
    periodo: 'segundo trimestre',
    calificacion: null,
    comentario: null,
    fecha_registro: null,
  },
  {
    asignacion_id: 13,
    materia_id: 2,
    nombre_materia: 'Historia',
    docente_id: 2,
    docente_nombre: 'Pedro',
    docente_apellido: 'Ruiz',
    periodo: 'tercer trimestre',
    calificacion: null,
    comentario: null,
    fecha_registro: null,
  },
];

const mockSignatures = [
  {
    firma_id: 1,
    alumno_id: 5,
    periodo: 'primer trimestre',
    comentario: 'Enterado, gracias.',
    fecha_firma: '2026-06-03T15:00:00.000Z',
  },
];

const mockAllThreeSignatures = [
  {
    firma_id: 1,
    alumno_id: 5,
    periodo: 'primer trimestre',
    comentario: 'Enterado, gracias.',
    fecha_firma: '2026-06-03T15:00:00.000Z',
  },
  {
    firma_id: 2,
    alumno_id: 5,
    periodo: 'segundo trimestre',
    comentario: null,
    fecha_firma: '2026-06-04T10:00:00.000Z',
  },
  {
    firma_id: 3,
    alumno_id: 5,
    periodo: 'tercer trimestre',
    comentario: 'Revisado',
    fecha_firma: '2026-06-05T12:00:00.000Z',
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

describe('GET /api/movil/tutor/hijos/:alumno_id/calificaciones', () => {
  it('should return 200 with report card for linked child', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('alumno');
    expect(res.body.data).toHaveProperty('boleta');
  });

  it('should include alumno object in response', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data.alumno).toMatchObject({
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
    });
  });

  it('should group boleta by asignacion_id', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRowsMultipleSubjects);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data.boleta).toHaveLength(2);
  });

  it('should include asignacion_id in each boleta item', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data.boleta[0]).toHaveProperty('asignacion_id');
    expect(res.body.data.boleta[0].asignacion_id).toBe(12);
  });

  it('should include all three trimesters in calificaciones', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    const calificaciones = res.body.data.boleta[0].calificaciones;
    expect(calificaciones).toHaveLength(3);
    expect(calificaciones[0].periodo).toBe('primer trimestre');
    expect(calificaciones[1].periodo).toBe('segundo trimestre');
    expect(calificaciones[2].periodo).toBe('tercer trimestre');
  });

  it('should keep trimester order fixed', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    const calificaciones = res.body.data.boleta[0].calificaciones;
    expect(calificaciones[0].periodo).toBe('primer trimestre');
    expect(calificaciones[1].periodo).toBe('segundo trimestre');
    expect(calificaciones[2].periodo).toBe('tercer trimestre');
  });

  it('should return nota: null for missing trimester grade', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data.boleta[0].calificaciones[1].nota).toBeNull();
  });

  it('should return comentario: null for missing trimester grade', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data.boleta[0].calificaciones[1].comentario).toBeNull();
  });

  it('should return fecha_registro: null for missing trimester grade', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data.boleta[0].calificaciones[1].fecha_registro).toBeNull();
  });

  it('should convert PostgreSQL NUMERIC string to JS number', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    const nota = res.body.data.boleta[0].calificaciones[0].nota;
    expect(typeof nota).toBe('number');
    expect(nota).toBe(9.5);
  });

  it('should include comment in the response', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data.boleta[0].calificaciones[0].comentario).toBe('Excelente');
  });

  it('should use snake_case in response', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    const boletaItem = res.body.data.boleta[0];
    expect(boletaItem).toHaveProperty('asignacion_id');
    expect(boletaItem.materia).toHaveProperty('materia_id');
    expect(boletaItem.docente).toHaveProperty('docente_id');
    expect(boletaItem.calificaciones[0]).toHaveProperty('fecha_registro');
  });

  it('should return subject assignments even when no grades exist', async () => {
    const allNullRows = mockGradeRows.map((r) => ({
      ...r,
      calificacion: null,
      comentario: null,
      fecha_registro: null,
    }));

    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(allNullRows);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data.boleta).toHaveLength(1);
    expect(res.body.data.boleta[0].materia.nombre).toBe('Matemáticas');
    expect(res.body.data.boleta[0].calificaciones[0].nota).toBeNull();
  });

  it('should return boleta: [] when group has no assignments', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
    (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.body.data.boleta).toEqual([]);
  });

  describe('firmas array', () => {
    it('should include firmas array in response', async () => {
      (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
      (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

      const res = await request(app)
        .get('/api/movil/tutor/hijos/5/calificaciones')
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.body.data).toHaveProperty('firmas');
      expect(Array.isArray(res.body.data.firmas)).toBe(true);
    });

    it('should contain exactly 3 trimester slots', async () => {
      (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
      (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

      const res = await request(app)
        .get('/api/movil/tutor/hijos/5/calificaciones')
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.body.data.firmas).toHaveLength(3);
    });

    it('should keep trimester order fixed', async () => {
      (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
      (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

      const res = await request(app)
        .get('/api/movil/tutor/hijos/5/calificaciones')
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.body.data.firmas[0].periodo).toBe('primer trimestre');
      expect(res.body.data.firmas[1].periodo).toBe('segundo trimestre');
      expect(res.body.data.firmas[2].periodo).toBe('tercer trimestre');
    });

    it('should return firmada: false and null values for unsigned trimesters', async () => {
      (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
      (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

      const res = await request(app)
        .get('/api/movil/tutor/hijos/5/calificaciones')
        .set('Authorization', `Bearer ${tutorToken}`);

      for (const firma of res.body.data.firmas) {
        expect(firma.firmada).toBe(false);
        expect(firma.firma_id).toBeNull();
        expect(firma.comentario).toBeNull();
        expect(firma.fecha_firma).toBeNull();
      }
    });

    it('should return firmada: true for signed trimester', async () => {
      (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
      (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);
      (findSignaturesByTutorAndStudentId as jest.Mock).mockResolvedValue(mockSignatures);

      const res = await request(app)
        .get('/api/movil/tutor/hijos/5/calificaciones')
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.body.data.firmas[0].firmada).toBe(true);
      expect(res.body.data.firmas[0].firma_id).toBe(1);
      expect(res.body.data.firmas[0].comentario).toBe('Enterado, gracias.');
      expect(res.body.data.firmas[0].fecha_firma).toBe('2026-06-03T15:00:00.000Z');
    });

    it('should return firmada: false for unsigned trimesters when others are signed', async () => {
      (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
      (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);
      (findSignaturesByTutorAndStudentId as jest.Mock).mockResolvedValue(mockSignatures);

      const res = await request(app)
        .get('/api/movil/tutor/hijos/5/calificaciones')
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.body.data.firmas[0].firmada).toBe(true);
      expect(res.body.data.firmas[1].firmada).toBe(false);
      expect(res.body.data.firmas[2].firmada).toBe(false);
    });

    it('should return all three signed when all trimesters are signed', async () => {
      (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
      (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);
      (findSignaturesByTutorAndStudentId as jest.Mock).mockResolvedValue(mockAllThreeSignatures);

      const res = await request(app)
        .get('/api/movil/tutor/hijos/5/calificaciones')
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.body.data.firmas[0].firmada).toBe(true);
      expect(res.body.data.firmas[1].firmada).toBe(true);
      expect(res.body.data.firmas[2].firmada).toBe(true);
    });

    it('should query signatures for the authenticated tutor', async () => {
      (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(mockChildMateo);
      (findConsolidatedGradesByStudentAndGroupId as jest.Mock).mockResolvedValue(mockGradeRows);

      await request(app)
        .get('/api/movil/tutor/hijos/5/calificaciones')
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(findSignaturesByTutorAndStudentId).toHaveBeenCalledWith(3, 5);
    });
  });

  it('should return 404 for unlinked student', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/999/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Student not found');
  });

  it('should return same 404 for nonexistent student', async () => {
    (findChildByTutorAndStudentId as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/movil/tutor/hijos/99999/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Student not found');
  });

  it('should return 400 for invalid alumno_id string', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/abc/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('fail');
  });

  it('should return 400 for alumno_id zero', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/0/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for negative alumno_id', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/-1/calificaciones')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 403 for docente role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${docenteToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 403 for admin role', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 without Authorization header', async () => {
    const res = await request(app).get('/api/movil/tutor/hijos/5/calificaciones');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/movil/tutor/hijos/5/calificaciones')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });
});
