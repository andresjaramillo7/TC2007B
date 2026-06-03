-- Phase 6D — Add asignacion_docente_id to existing chats table
--
-- Run this only when preserving an existing local database.
-- For a fresh database, simply run database/schema.sql which already
-- includes asignacion_docente_id with NOT NULL and UNIQUE.
--
-- Usage:
--   psql -U postgres -d grade_tracker -f database/migrations/phase6d_add_chat_assignment.sql
--
-- If backfill cannot resolve all legacy rows, the migration stops
-- with a clear message. You may then manually inspect and resolve
-- the remaining ambiguous or duplicate chats.

BEGIN;

-- Step 1: Add column as nullable
ALTER TABLE chats
  ADD COLUMN IF NOT EXISTS asignacion_docente_id INTEGER
  REFERENCES asignaciones_docentes(id) ON DELETE RESTRICT;

-- Step 2: Backfill deterministic legacy chats
-- Assign only when exactly one candidate assignment exists per chat
WITH candidates AS (
  SELECT
    c.id AS chat_id,
    MIN(ad.id) AS asignacion_docente_id,
    COUNT(DISTINCT ad.id) AS candidate_count
  FROM chats c
  JOIN alumnos a ON a.id = c.alumno_id
  JOIN chat_participantes cp ON cp.chat_id = c.id
  JOIN usuarios u ON u.id = cp.usuario_id AND u.rol = 'docente'
  JOIN asignaciones_docentes ad
    ON ad.docente_id = u.id AND ad.grupo_id = a.grupo_id
  WHERE c.asignacion_docente_id IS NULL
  GROUP BY c.id
)
UPDATE chats c
SET asignacion_docente_id = candidates.asignacion_docente_id
FROM candidates
WHERE c.id = candidates.chat_id
  AND candidates.candidate_count = 1;

-- Step 3: Check for unresolved NULL chats
DO $$
DECLARE
  unresolved_count INT;
  unresolved_ids TEXT;
BEGIN
  SELECT COUNT(*) INTO unresolved_count
  FROM chats
  WHERE asignacion_docente_id IS NULL;

  IF unresolved_count > 0 THEN
    SELECT string_agg(id::text, ', ') INTO unresolved_ids
    FROM chats
    WHERE asignacion_docente_id IS NULL;

    RAISE WARNING 'Unresolved chats without asignacion_docente_id: %', unresolved_ids;
    RAISE EXCEPTION 'Migration stopped: % chat(s) could not be backfilled automatically. Manually inspect chat_id(s): %', unresolved_count, unresolved_ids;
  END IF;
END $$;

-- Step 4: Check for duplicate alumno_id + asignacion_docente_id pairs
DO $$
DECLARE
  duplicate_count INT;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT alumno_id, asignacion_docente_id
    FROM chats
    WHERE asignacion_docente_id IS NOT NULL
    GROUP BY alumno_id, asignacion_docente_id
    HAVING COUNT(*) > 1
  ) dupes;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Migration stopped: duplicate alumno_id + asignacion_docente_id pairs exist. Resolve duplicates before adding the unique constraint.';
  END IF;
END $$;

-- Step 5: Add unique index (safe with concurrent writes)
CREATE UNIQUE INDEX IF NOT EXISTS uq_chats_alumno_asignacion
  ON chats(alumno_id, asignacion_docente_id);

-- Step 6: Promote to NOT NULL now that all rows are populated
ALTER TABLE chats
  ALTER COLUMN asignacion_docente_id SET NOT NULL;

COMMIT;
