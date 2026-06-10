-- Phase 7 — Add audit_logs table for security audit trail
--
-- Run this when preserving an existing local database.
-- For a fresh database, run database/schema.sql which already
-- includes the audit_logs table.
--
-- Usage:
--   psql -U postgres -d grade_tracker_test -f database/migrations/phase7_audit_logs.sql

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  accion VARCHAR(80) NOT NULL,
  entidad VARCHAR(80),
  entidad_id INTEGER,
  exitoso BOOLEAN NOT NULL,
  detalles JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
