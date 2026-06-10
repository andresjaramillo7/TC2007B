# Security Checklist — Grade Tracker Backend

## Security Objectives

Confidentiality, integrity, availability, and authenticity of academic grade data.

## Implemented Application Controls

| Control                          | Status                                             | Evidence                                                             |
| -------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| Password hashing                 | bcryptjs, 10 salt rounds                           | `src/scripts/seedUsers.ts:16`                                        |
| Strong seed-password policy      | Min 12 chars, uppercase, lowercase, number, symbol | `src/utils/validatePasswordPolicy.ts`                                |
| JWT authentication               | Bearer token, configurable expiry                  | `src/middlewares/authenticate.ts`                                    |
| Role-based authorization         | docente, tutor, admin                              | `src/middlewares/authorizeRoles.ts`                                  |
| Tutor-to-child access control    | `WHERE ta.tutor_id = $1`                           | `src/models/children.model.ts:22-23`                                 |
| Teacher assignment authorization | `WHERE id = $1 AND docente_id = $2`                | `src/models/grades.model.ts:33-35`                                   |
| Parameterized SQL                | All queries use `$1`, `$2` placeholders            | e.g., `src/models/user.model.ts:15`, `src/models/grades.model.ts:34` |
| Audit logging                    | Non-blocking insert of key events                  | `src/models/audit-log.model.ts`                                      |
| Direct HTTPS                     | Required, TLS 1.2/1.3                              | `src/server.ts`                                                      |

## Password Hashing

bcryptjs with 10 salt rounds. Password hash is excluded from all API responses via `sanitizeUser()`.

## Strong Seed-Password Policy

Demo credentials in `src/scripts/seedUsers.ts`:

| Email                  | Password         |
| ---------------------- | ---------------- |
| `teacher@example.com`  | `Demo_Teacher1!` |
| `teacher2@example.com` | `Demo_Teacher2!` |
| `tutor@example.com`    | `Demo_Tutor123!` |
| `admin@example.com`    | `Demo_Admin123!` |

Policy: minimum 12 characters, at least one uppercase, one lowercase, one number, one symbol.

## JWT and Access Control

- JWT signed with configurable secret, default 8-hour expiry.
- `authenticate` middleware verifies the Bearer token before every protected route.
- `authorizeRoles` middleware restricts endpoints by role.
- Admin role can access all teacher and tutor endpoints.
- Tutor role is limited to own children and associated resources.

## SQL Injection Protection

All database queries use PostgreSQL parameterized placeholders (`$1`, `$2`, …). No template literals or string concatenation with runtime values.

Representative safe queries:

- `src/models/user.model.ts:15` — `SELECT * FROM usuarios WHERE email = $1`
- `src/models/grades.model.ts:34` — `SELECT 1 FROM asignaciones_docentes WHERE id = $1 AND docente_id = $2 LIMIT 1`
- `src/models/report-card.model.ts:106-116` — `INSERT INTO firmas_boleta … VALUES ($1, $2, $3)`

## Audit-Log Events

| Event                  | Trigger                       | Logged Details                    |
| ---------------------- | ----------------------------- | --------------------------------- |
| `LOGIN_SUCCESS`        | Successful authentication     | User ID                           |
| `LOGIN_FAILED`         | Failed authentication attempt | Email (never password)            |
| `GRADE_UPSERT`         | Single grade saved            | alumno_id, asignacion_id, periodo |
| `GRADE_BULK_UPSERT`    | Bulk grade save               | asignacion_id, periodo, count     |
| `REPORT_CARD_SIGNED`   | Report card signature         | alumno_id, periodo                |
| `ANNOUNCEMENT_CREATED` | New announcement              | grupo_id                          |

All audit writes are non-blocking — failures log a warning and do not affect the API response.

## HTTPS Local Architecture

```
┌──────────────────────────────────────┐
│  Client                              │
│    → HTTPS https://localhost:3443     │
│         │                            │
│         ▼                            │
│  Bun / Express / Node.js             │
│  ┌────────────────────────────────┐  │
│  │  HTTPS (always on)             │  │
│  │  → TLS 1.2 minimum             │  │
│  │  → TLS 1.3 maximum             │  │
│  └────────────────────────────────┘  │
│         │                            │
│         ▼                            │
│  ┌──────────────┐                   │
│  │  PostgreSQL  │ (localhost:5432)   │
│  └──────────────┘                   │
└──────────────────────────────────────┘
```

## Certificate Generation

```bash
./scripts/generate-local-cert.sh
```

Creates `.local-certs/localhost-key.pem` and `.local-certs/localhost-cert.pem` (self-signed, RSA 2048, SHA-256, SAN DNS:localhost + IP:127.0.0.1, 365-day validity).

## HTTPS Startup

```bash
# 1. Generate certs (first time only)
bun run cert

# 2. Start server
bun run dev

# 3. Verify TLS
bun run tls
```

## TLS Verification

```bash
# TLS 1.2 — should succeed
curl -k --tlsv1.2 --tls-max 1.2 https://localhost:3443/api/docs.json

# TLS 1.3 — should succeed
curl -k --tlsv1.3 --tls-max 1.3 https://localhost:3443/api/docs.json

# TLS 1.1 — should fail
curl -k --tlsv1.1 --tls-max 1.1 https://localhost:3443/api/docs.json
```

## PostgreSQL Read-Only Role

Run the helper script:

```bash
psql -U postgres -d grade_tracker_test -f database/security/create_readonly_role.sql
```

Then set a password:

```sql
\password grade_tracker_readonly
```

Verify:

```bash
# SELECT succeeds
psql -U grade_tracker_readonly -d grade_tracker_test -c 'SELECT COUNT(*) FROM usuarios;'

# INSERT fails (permission denied)
psql -U grade_tracker_readonly -d grade_tracker_test -c 'INSERT INTO usuarios (email, password_hash, nombre, apellido, rol) VALUES ('\''x@x.com'\'', '\''x'\'', '\''x'\'', '\''x'\'', '\''tutor'\'');'

# UPDATE fails (permission denied)
psql -U grade_tracker_readonly -d grade_tracker_test -c 'UPDATE usuarios SET nombre = '\''x'\'' WHERE id = 1;'

# DELETE fails (permission denied)
psql -U grade_tracker_readonly -d grade_tracker_test -c 'DELETE FROM usuarios WHERE id = 1;'
```

## Robust PostgreSQL Password

```sql
ALTER USER grade_tracker_user WITH PASSWORD 'strong-password-here';
ALTER USER grade_tracker_readonly WITH PASSWORD 'different-strong-password';
```

## PostgreSQL Authentication Verification

```sql
SHOW password_encryption;
-- Expected: scram-sha-256

SHOW hba_file;
-- Inspect the file path
```

## Firewall Evidence Checklist

- [ ] Port 3443/TCP open in firewall (for HTTPS local testing)
- [ ] PostgreSQL port 5432/TCP restricted to localhost
- [ ] Confirm with instructor whether port 3050/TCP is required

## Arch Linux System Update

```bash
sudo pacman -Syu
```

## Required Screenshots

1. Successful TLS 1.2 curl output
2. Successful TLS 1.3 curl output
3. Failed TLS 1.1 curl output
4. `SHOW password_encryption;` → scram-sha-256
5. Read-only user SELECT succeeds
6. Read-only user INSERT fails
7. Audit log entries (`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5;`)

## Mobile-Team Responsibilities

- Reject cleartext HTTP in the mobile app
- Configure Android Network Security Config to trust local self-signed certificate (debug builds only)
- Handle no-internet, timeout, and server-error states with friendly user messages

## Port 3050/TCP Clarification

The academic requirement mentions port 3050/TCP. This project uses PostgreSQL, whose default port is 5432/TCP. Confirm with the instructor whether 3050/TCP belongs to a generic template. For local testing, PostgreSQL should remain limited to localhost.
