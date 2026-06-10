import { query } from '../db/connection';
import type { AuditLogEntry } from '../types/audit-log.types';

export async function insertAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
        await query(
            `INSERT INTO audit_logs (usuario_id, accion, entidad, entidad_id, exitoso, detalles)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
            [
                entry.usuarioId,
                entry.accion,
                entry.entidad ?? null,
                entry.entidadId ?? null,
                entry.exitoso,
                entry.detalles ? JSON.stringify(entry.detalles) : null,
            ],
        );
    } catch (err) {
        console.warn(
            // eslint-disable-line no-console
            'Audit log insert failed (non-blocking):',
            err instanceof Error ? err.message : String(err),
        );
    }
}
