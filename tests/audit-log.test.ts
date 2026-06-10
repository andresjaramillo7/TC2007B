jest.mock('../src/db/connection', () => {
    const mockQuery = jest.fn();
    return {
        query: mockQuery,
    };
});

import { insertAuditLog } from '../src/models/audit-log.model';
import { query } from '../src/db/connection';

const mockQuery = query as jest.Mock;

describe('Audit log insert helper', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should accept LOGIN_SUCCESS entry', async () => {
        mockQuery.mockResolvedValue([]);

        await insertAuditLog({
            usuarioId: 1,
            accion: 'LOGIN_SUCCESS',
            exitoso: true,
        });

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(sql).toContain('INSERT INTO audit_logs');
        expect(params[0]).toBe(1);
        expect(params[1]).toBe('LOGIN_SUCCESS');
        expect(params[4]).toBe(true);
    });

    it('should accept LOGIN_FAILED entry without password', async () => {
        mockQuery.mockResolvedValue([]);

        await insertAuditLog({
            usuarioId: null,
            accion: 'LOGIN_FAILED',
            exitoso: false,
            detalles: { email: 'test@example.com' },
        });

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const params = mockQuery.mock.calls[0][1];
        expect(params[5]).not.toContain('password');
        expect(params[5]).toContain('test@example.com');
    });

    it('should accept GRADE_UPSERT entry', async () => {
        mockQuery.mockResolvedValue([]);

        await insertAuditLog({
            usuarioId: 1,
            accion: 'GRADE_UPSERT',
            entidad: 'calificacion',
            entidadId: 45,
            exitoso: true,
            detalles: { alumno_id: 100, asignacion_id: 10, periodo: 'primer trimestre' },
        });

        expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should accept GRADE_BULK_UPSERT entry', async () => {
        mockQuery.mockResolvedValue([]);

        await insertAuditLog({
            usuarioId: 1,
            accion: 'GRADE_BULK_UPSERT',
            entidad: 'calificaciones',
            exitoso: true,
            detalles: { asignacion_id: 10, periodo: 'primer trimestre', count: 5 },
        });

        expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should accept REPORT_CARD_SIGNED entry', async () => {
        mockQuery.mockResolvedValue([]);

        await insertAuditLog({
            usuarioId: 3,
            accion: 'REPORT_CARD_SIGNED',
            entidad: 'firmas_boleta',
            entidadId: 12,
            exitoso: true,
            detalles: { alumno_id: 5, periodo: 'primer trimestre' },
        });

        expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should accept ANNOUNCEMENT_CREATED entry', async () => {
        mockQuery.mockResolvedValue([]);

        await insertAuditLog({
            usuarioId: 1,
            accion: 'ANNOUNCEMENT_CREATED',
            entidad: 'avisos_grupales',
            entidadId: 7,
            exitoso: true,
            detalles: { grupo_id: 2 },
        });

        expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should not throw when audit insert fails (non-blocking)', async () => {
        mockQuery.mockRejectedValue(new Error('DB connection lost'));

        await expect(
            insertAuditLog({
                usuarioId: 1,
                accion: 'LOGIN_SUCCESS',
                exitoso: true,
            }),
        ).resolves.toBeUndefined();
    });
});
