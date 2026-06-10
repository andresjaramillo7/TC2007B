-- ============================================================
-- Read-only role for Grade Tracker (manual setup)
-- ============================================================
-- Run inside psql as a superuser or a role with CREATEROLE.
-- This script is idempotent.
--
-- Usage:
--   psql -U postgres -d grade_tracker_test -f database/security/create_readonly_role.sql
--
-- After creation, set a strong password manually:
--   \password grade_tracker_readonly
--
-- Verify:
--   SELECT succeeds:
--     psql -U grade_tracker_readonly -d grade_tracker_test -c 'SELECT COUNT(*) FROM usuarios;'
--
--   INSERT fails (permission denied):
--     psql -U grade_tracker_readonly -d grade_tracker_test -c 'INSERT INTO usuarios (email, password_hash, nombre, apellido, rol) VALUES (''x@x.com'', ''x'', ''x'', ''x'', ''tutor'');'
--
--   UPDATE fails (permission denied):
--     psql -U grade_tracker_readonly -d grade_tracker_test -c 'UPDATE usuarios SET nombre = ''x'' WHERE id = 1;'
--
--   DELETE fails (permission denied):
--     psql -U grade_tracker_readonly -d grade_tracker_test -c 'DELETE FROM usuarios WHERE id = 1;'
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles
    WHERE rolname = 'grade_tracker_readonly'
  ) THEN
    CREATE ROLE grade_tracker_readonly
      WITH LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE grade_tracker_test TO grade_tracker_readonly;
GRANT USAGE ON SCHEMA public TO grade_tracker_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO grade_tracker_readonly;

ALTER DEFAULT PRIVILEGES
  FOR ROLE grade_tracker_user
  IN SCHEMA public
  GRANT SELECT ON TABLES TO grade_tracker_readonly;
