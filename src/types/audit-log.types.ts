export type AuditAction =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'GRADE_UPSERT'
    | 'GRADE_BULK_UPSERT'
    | 'REPORT_CARD_SIGNED'
    | 'ANNOUNCEMENT_CREATED';

export interface AuditLogEntry {
    usuarioId: number | null;
    accion: AuditAction;
    entidad?: string;
    entidadId?: number;
    exitoso: boolean;
    detalles?: Record<string, unknown>;
}
