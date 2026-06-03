# Grade Tracker Backend

Backend API for the Grade Tracker project — a school grade management platform with:
- **Mobile app** for parents/tutors (grades, sign-offs, chats, notifications)
- **Web platform** for teachers (grade management, chats, announcements)

## Tech Stack

- **Runtime:** Bun 1.x
- **Language:** TypeScript
- **Framework:** Express 5
- **Database:** PostgreSQL (via `pg`)
- **Validation:** Zod
- **Authentication:** JWT + bcryptjs
- **Testing:** Jest + Supertest

## Prerequisites

- [Bun](https://bun.sh) 1.x installed
- PostgreSQL running locally

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/andresjaramillo7/TC2007B.git
cd TC2007B
bun install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Create the database
createdb grade_tracker

# 4. Run the schema
psql -d grade_tracker -f database/schema.sql

# 5. Seed test users
bun run seed

# 6. Seed academic data (groups, subjects, assignments, students)
bun run seed:academic

# 7. Seed grades (trimester grades for students)
bun run seed:grades

# 8. Seed messaging data (chats, participants, messages)
bun run seed:messaging

# 9. Seed announcements (avisos grupales)
bun run seed:announcements

# 10. Start development server
bun run dev
```

The server starts at `http://localhost:3000`.

## Available Scripts

| Script | Description |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Start development server with hot reload via Bun |
| `bun run build` | Compile TypeScript to `dist/` |
| `bun run start` | Run compiled app from `dist/` |
| `bun run seed` | Insert test users into the database |
| `bun run seed:academic` | Insert academic data (groups, subjects, assignments, students) |
| `bun run seed:grades` | Insert sample grades for testing |
| `bun run seed:messaging` | Insert messaging data (chats, participants, messages) |
| `bun run seed:announcements` | Insert group announcements for testing |
| `bun run test` | Run tests |
| `bun run lint` | Run ESLint |
| `bun run format` | Format code with Prettier |

## Authentication Endpoints

### Login

Authenticate with email and password to receive a JWT.

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "password123"
}
```

**Success response (200):**

```json
{
  "status": "success",
  "data": {
    "token": "<jwt-token>",
    "user": {
      "id": 1,
      "email": "teacher@example.com",
      "nombre": "Ana",
      "apellido": "López",
      "rol": "docente",
      "foto_url": null
    }
  }
}
```

**Error responses:**

| Status | Scenario |
|---|---|
| 400 | Invalid email format or missing fields |
| 401 | Invalid email or password (generic, does not reveal which) |
| 500 | Unexpected server error |

### Current Authenticated User

Returns the authenticated user's profile. Requires a valid Bearer token.

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Success response (200):**

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "teacher@example.com",
      "nombre": "Ana",
      "apellido": "López",
      "rol": "docente",
      "foto_url": null
    }
  }
}```

**Error responses:**

| Status | Scenario |
|---|---|
| 401 | Missing, invalid, or expired token |
| 401 | Authenticated user no longer exists in the database |

## Roles

| Role | Description |
|---|---|
| `docente` | Teacher — can manage grades for assigned groups and message tutors |
| `tutor` | Parent/tutor — can view children's grades and sign off |
| `admin` | Administrator — can inspect and interact with all chats, and manage announcements for any group |

## Seed Users

Run `bun run seed` to insert these local test users:

| Email | Password | Name | Role |
|---|---|---|---|
| `teacher@example.com` | `password123` | Ana López | `docente` |
| `teacher2@example.com` | `password123` | Pedro Ruiz | `docente` |
| `tutor@example.com` | `password123` | Carlos García | `tutor` |
| `admin@example.com` | `password123` | María Administrador | `admin` |

The seed script is safe to run multiple times — it uses `ON CONFLICT (email) DO NOTHING`.

## Seed Academic Data

After seeding users, run `bun run seed:academic` to insert:

- 3 groups (1° A, 2° B, 3° C) for school year 2026-2027
- 3 subjects (Matemáticas, Historia, Ciencias)
- Teacher assignments linking teachers to groups and subjects
- 10 fictional students distributed across groups

The seed is safe to run multiple times — it uses `ON CONFLICT` on all inserts.

## Seed Grades

After seeding academic data, run `bun run seed:grades` to insert:

- 4 grade records for 2 teachers, 2 students, across 2 assignments
- Sample data covering grade history and assignment table scenarios

The seed is safe to run multiple times — it uses `ON CONFLICT DO NOTHING`.

## Seed Messaging Data

After seeding users and academic data, run `bun run seed:messaging` to insert:

- 2 tutor-student relationships (`tutor@example.com` linked to Mateo Jaramillo and Sofía Martínez)
- 3 chats with participants:
  - Chat 1: teacher1 + tutor about Mateo (with sample messages)
  - Chat 2: teacher2 + tutor about Mateo (with sample messages)
  - Chat 3: teacher1 + tutor about Sofía (empty)
- Sample messages in chats 1 and 2 with mixed read/unread status

The seed is safe to run multiple times — existing chats and participants are not duplicated.

## Grade Rules

| Rule | Detail |
|---|---|
| Range | 0.00 to 10.00, decimals allowed (e.g. 8.5, 9.75) |
| Periods | `primer trimestre`, `segundo trimestre`, `tercer trimestre` (exact lowercase) |
| Comments | Optional, nullable, max 500 characters |
| Upsert behavior | `INSERT` if no grade exists, `UPDATE` if it does (same student + assignment + period) |
| Bulk transaction | All upserts run in a single PostgreSQL transaction; any failure rolls back the entire batch |

## Grade Endpoints (Teacher Web Platform)

All grade endpoints require `authenticate` and `authorizeRoles("docente", "admin")`.

### Student Grade History

Returns grades visible to the authenticated user for a specific student.

```http
GET /api/web/docente/alumnos/:alumno_id/calificaciones
Authorization: Bearer <token>
```

**Behavior:**

- `docente` — returns only grades linked to the teacher's own assignments
- `admin` — returns all grades for the student
- `tutor` — `403 Forbidden`

**Success response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "calificacion_id": 88,
      "asignacion_id": 12,
      "materia": "Matemáticas",
      "periodo": "primer trimestre",
      "nota": 9.5,
      "comentario": "Excelente",
      "fecha_registro": "2026-06-03T10:30:00.000Z"
    }
  ]
}
```

### Assignment Grade Table by Trimester

Returns all students in the assignment group, including those without a recorded grade.

```http
GET /api/web/docente/asignaciones/:asignacion_id/calificaciones?periodo=primer%20trimestre
Authorization: Bearer <token>
```

**Required query:** `periodo` — one of `primer trimestre`, `segundo trimestre`, `tercer trimestre`

**Success response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "alumno": {
        "alumno_id": 5,
        "nombre": "Mateo",
        "apellido": "Jaramillo",
        "foto_url": null
      },
      "calificacion": {
        "calificacion_id": 88,
        "nota": 9.5,
        "comentario": "Excelente",
        "fecha_registro": "2026-06-03T10:30:00.000Z"
      }
    },
    {
      "alumno": {
        "alumno_id": 6,
        "nombre": "Sofía",
        "apellido": "López",
        "foto_url": null
      },
      "calificacion": null
    }
  ]
}
```

### Individual Grade Upsert

Create or update a grade for one student.

```http
POST /api/web/docente/calificaciones
Authorization: Bearer <token>
Content-Type: application/json

{
  "alumno_id": 5,
  "asignacion_id": 12,
  "periodo": "primer trimestre",
  "nota": 8.5,
  "comentario": "Buen trabajo"
}
```

`comentario` may be `null` or omitted.

**Success response (200):**
```json
{
  "status": "success",
  "data": {
    "message": "Calificación registrada con éxito",
    "calificacion_id": 45
  }
}
```

### Bulk Grade Upsert

Create or update grades for multiple students in the same assignment and trimester.

```http
POST /api/web/docente/calificaciones/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "asignacion_id": 12,
  "periodo": "primer trimestre",
  "calificaciones": [
    {
      "alumno_id": 5,
      "nota": 8.5,
      "comentario": "Buen trabajo"
    },
    {
      "alumno_id": 6,
      "nota": 9.2,
      "comentario": null
    }
  ]
}
```

**Rules:**

- 1 to 100 records per request
- No duplicate `alumno_id` values allowed
- All students must belong to the assignment group
- Entire operation runs in a PostgreSQL transaction

**Success response (200):**
```json
{
  "status": "success",
  "data": {
    "message": "Calificaciones registradas con éxito",
    "actualizadas": 2
  }
}
```

## Messaging Endpoints (Teacher Web Platform)

All messaging endpoints require `authenticate` and `authorizeRoles("docente", "admin")`.

### Chat Inbox

Returns the authenticated teacher's chat conversations.

```http
GET /api/web/docente/chats
Authorization: Bearer <token>
```

**Behavior:**

- `docente` — returns only chats where the teacher is a participant
- `admin` — returns all chats (administrative override)
- `tutor` — `403 Forbidden`
- Sorted by most recent activity first; empty chats appear last

**Success response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "chat_id": 1,
      "tutor": {
        "tutor_id": 3,
        "nombre": "Carlos",
        "apellido": "García"
      },
      "alumno": {
        "alumno_id": 5,
        "nombre": "Mateo",
        "apellido": "Jaramillo"
      },
      "ultimo_mensaje": "Hola Miss, quería preguntarle...",
      "ultima_fecha": "2026-06-03T15:00:00.000Z",
      "no_leidos": 2
    }
  ]
}
```

For a chat with no messages:
```json
{
  "chat_id": 3,
  "tutor": { "tutor_id": 3, "nombre": "Carlos", "apellido": "García" },
  "alumno": { "alumno_id": 6, "nombre": "Sofía", "apellido": "Martínez" },
  "ultimo_mensaje": null,
  "ultima_fecha": null,
  "no_leidos": 0
}
```

**Unread count rules:**
- `docente` — counts messages where `leido = false` and `remitente_id` is not the authenticated teacher
- `admin` — always `0` (admin inspection does not track personal unread messages)

### Read Chat Messages

Returns paginated messages from an authorized chat.

```http
GET /api/web/docente/chats/:chat_id/mensajes?page=1&limit=20
Authorization: Bearer <token>
```

**Path params:**

| Param | Type | Description |
|---|---|---|
| `chat_id` | integer | Positive chat ID |

**Query params:**

| Param | Type | Default | Max | Description |
|---|---|---|---|---|
| `page` | integer | 1 | — | Page number (positive integer) |
| `limit` | integer | 20 | 100 | Messages per page |

**Behavior:**

- `docente` — must be a participant in the chat; otherwise `404 Chat not found`
- `admin` — may read any existing chat without being a participant
- `tutor` — `403 Forbidden`
- Messages ordered newest-first (`fecha_envio DESC, id DESC`)
- After authorization, incoming unread messages are marked as read for `docente`
- Admin does **not** mark messages as read (inspection-only)

**Success response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "mensaje_id": 101,
      "remitente_id": 3,
      "contenido": "Buenas tardes",
      "leido": true,
      "fecha_envio": "2026-06-03T15:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

### Send Message

Sends a new message inside an authorized chat.

```http
POST /api/web/docente/chats/:chat_id/mensajes
Authorization: Bearer <token>
Content-Type: application/json

{
  "contenido": "Le comento que Mateo ha mostrado un excelente avance."
}
```

**Validation rules:**

| Field | Rule |
|---|---|
| `contenido` | Trimmed string, 1–2000 visible characters |

**Behavior:**

- `docente` — must be a participant; otherwise `404 Chat not found`
- `admin` — may send to any existing chat as administrative override (not added to participants)
- `tutor` — `403 Forbidden`
- New messages are inserted with `leido = false` and `remitente_id` set to the authenticated user

**Success response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "mensaje_id": 102,
    "remitente_id": 1,
    "contenido": "Le comento que Mateo ha mostrado un excelente avance.",
    "leido": false,
    "fecha_envio": "2026-06-03T15:01:00.000Z"
  }
}
```

**Error responses:**

| Status | Scenario |
|---|---|
| 400 | Invalid `chat_id`, empty `contenido`, or `contenido` over 2000 characters |
| 401 | Missing, invalid, or expired token |
| 403 | Authenticated `tutor` attempting teacher endpoint |
| 404 | Chat not found or unauthorized |

## Academic Endpoints (Teacher Web Platform)

### Teacher Assignments

Lists subjects and groups linked to the authenticated teacher.

```http
GET /api/web/docente/asignaciones
Authorization: Bearer <token>
```

**Roles allowed:** `docente`, `admin`

**Success response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "asignacion_id": 1,
      "grupo": {
        "grupo_id": 1,
        "nombre": "1° A",
        "grado": 1,
        "grupo_letra": "A",
        "ciclo_escolar": "2026-2027"
      },
      "materia": {
        "materia_id": 1,
        "nombre": "Matemáticas"
      }
    }
  ]
}
```

### Students by Authorized Group

Lists students enrolled in a group the teacher is authorized to access.

```http
GET /api/web/docente/grupos/:grupo_id/alumnos
Authorization: Bearer <token>
```

**Roles allowed:** `docente`, `admin`

**Success response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "alumno_id": 1,
      "nombre": "Mateo",
      "apellido": "Jaramillo",
      "foto_url": null
    }
  ]
}
```

**Error responses:**

| Status | Scenario |
|---|---|
| 400 | Invalid `grupo_id` (not a positive integer) |
| 401 | Missing, invalid, or expired token |
| 403 | Authenticated `tutor` attempting teacher endpoint |
| 404 | Group not found or unauthorized for teacher |

## Database Schema

The PostgreSQL schema includes:

- `usuarios` — users (auth, Phase 2)
- `grupos` — academic groups with unique `(grado, grupo_letra, ciclo_escolar)`
- `materias` — subjects
- `asignaciones_docentes` — teacher assignments linking teachers to groups and subjects
- `alumnos` — students enrolled in groups
- `calificaciones` — grades linked to students, assignments, and trimesters
- `tutor_alumno` — links tutors to students with a relationship type
- `chats` — conversations tied to a student (`alumno_id`)
- `chat_participantes` — maps users to chats
- `mensajes` — individual messages within chats
- `avisos_grupales` — group announcements published by teachers and admins
- `firmas_boleta` — trimester report-card signatures (one per tutor + student + trimester, upsert behavior)

Run `psql -d grade_tracker -f database/schema.sql` to apply.

## API Field Convention

All API request and response fields should use **snake_case**.

## Mobile Tutor Endpoints (Parent/Tutor Mobile App)

The mobile tutor module is split into two domains:
- **children** — linked students for the authenticated tutor
- **report-card** — consolidated report card (includes trimester signatures, PDF download)

All mobile tutor endpoints require `authenticate` and `authorizeRoles("tutor")`.

- `docente` → `403 Forbidden`
- `admin` → `403 Forbidden` (tutor mobile routes are tutor-only; no admin override)
- Missing or invalid JWT → `401 Unauthorized`

### Linked Children

Returns all students linked to the authenticated tutor through `tutor_alumno`.

```http
GET /api/movil/tutor/hijos
Authorization: Bearer <token>
```

**Success response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "alumno_id": 5,
      "nombre": "Mateo",
      "apellido": "Jaramillo",
      "nombre_completo": "Mateo Jaramillo",
      "grupo": {
        "grupo_id": 1,
        "nombre": "1° A",
        "grado": 1,
        "grupo_letra": "A",
        "ciclo_escolar": "2026-2027"
      },
      "foto_url": null,
      "parentesco": "padre"
    }
  ]
}
```

**Behavior:**
- Sorted by `apellido, nombre`
- Empty list returns `"data": []`

### Consolidated Report Card

Returns a full report card for one linked child, grouped by subject assignment.

```http
GET /api/movil/tutor/hijos/:alumno_id/calificaciones
Authorization: Bearer <token>
```

**Path params:**

| Param | Type | Description |
|---|---|---|
| `alumno_id` | integer | Positive student ID |

**Authorization:** The authenticated tutor must be linked to the student. If the student does not exist or is not linked, returns `404 Student not found` (same generic message).

**Success response (200):**
```json
{
  "status": "success",
  "data": {
    "alumno": {
      "alumno_id": 5,
      "nombre": "Mateo",
      "apellido": "Jaramillo",
      "nombre_completo": "Mateo Jaramillo",
      "grupo": {
        "grupo_id": 1,
        "nombre": "1° A",
        "grado": 1,
        "grupo_letra": "A",
        "ciclo_escolar": "2026-2027"
      },
      "foto_url": null
    },
    "boleta": [
      {
        "asignacion_id": 12,
        "materia": {
          "materia_id": 1,
          "nombre": "Matemáticas"
        },
        "docente": {
          "docente_id": 1,
          "nombre": "Ana",
          "apellido": "López"
        },
        "calificaciones": [
          {
            "periodo": "primer trimestre",
            "nota": 9.5,
            "comentario": "Excelente progreso",
            "fecha_registro": "2026-06-03T10:30:00.000Z"
          },
          {
            "periodo": "segundo trimestre",
            "nota": null,
            "comentario": null,
            "fecha_registro": null
          },
          {
            "periodo": "tercer trimestre",
            "nota": null,
            "comentario": null,
            "fecha_registro": null
          }
        ]
      }
    ],
    "firmas": [
      {
        "periodo": "primer trimestre",
        "firmada": true,
        "firma_id": 1,
        "comentario": "Enterado, gracias.",
        "fecha_firma": "2026-06-03T15:00:00.000Z"
      },
      {
        "periodo": "segundo trimestre",
        "firmada": false,
        "firma_id": null,
        "comentario": null,
        "fecha_firma": null
      },
      {
        "periodo": "tercer trimestre",
        "firmada": false,
        "firma_id": null,
        "comentario": null,
        "fecha_firma": null
      }
    ]
  }
}
```

**Report card rules:**
- Every subject assignment linked to the student's group is included
- Results are grouped by `asignacion_id`
- All three trimester slots are always present (`primer trimestre`, `segundo trimestre`, `tercer trimestre`)
- Missing trimester grades return `nota: null`, `comentario: null`, `fecha_registro: null`
- Subjects are sorted by subject name, then teacher name
- Groups with no assignments return `boleta: []`
- Always includes a `firmas` array with all 3 trimester slots in fixed order
- Signed trimesters show `firmada: true` with populated `firma_id`, `comentario`, `fecha_firma`
- Unsigned trimesters show `firmada: false` with null values
- Only the authenticated tutor's signatures are included

### Sign Trimester Report Card

Allows a tutor to sign (acknowledge) a linked student's report card for one trimester.

```http
POST /api/movil/tutor/hijos/:alumno_id/boletas/:periodo/firma
Authorization: Bearer <token>
Content-Type: application/json
```

**Path params:**

| Param | Type | Description |
|---|---|---|
| `alumno_id` | integer | Positive student ID |
| `periodo` | string | One of: `primer trimestre`, `segundo trimestre`, `tercer trimestre` |

**Body:**

```json
{
  "comentario": "Enterado, gracias."
}
```

The body may also be `{}` or `{ "comentario": null }`.

**Validation:**

| Field | Rule |
|---|---|
| `comentario` | Optional, nullable, string when present, trimmed, max 500 characters |

**Behavior:**
- One signature per tutor + student + trimester
- Uses PostgreSQL upsert (`ON CONFLICT ... DO UPDATE`)
- Signing again updates the comment and `fecha_firma`
- Requires at least one grade to exist for the selected trimester
- Cannot sign an empty trimester (returns `400 Bad Request`)

**Success response (200):**
```json
{
  "status": "success",
  "data": {
    "message": "Boleta firmada con éxito",
    "firma": {
      "firma_id": 1,
      "alumno_id": 5,
      "periodo": "primer trimestre",
      "comentario": "Enterado, gracias.",
      "fecha_firma": "2026-06-03T15:00:00.000Z"
    }
  }
}
```

**Errors:**

| Condition | Status |
|---|---|
| Unlinked or nonexistent student | 404 Student not found |
| No grades for the selected trimester | 400 Report card has no grades for this period |
| Invalid `alumno_id` | 400 Validation failed |
| Invalid `periodo` | 400 Validation failed |
| Comment over 500 chars | 400 Validation failed |
| `docente` or `admin` | 403 Forbidden |
| Missing/invalid JWT | 401 Unauthorized |

### Download Report Card PDF

Generates and downloads a dynamic PDF with the linked student's consolidated report card.

```http
GET /api/movil/tutor/hijos/:alumno_id/calificaciones/pdf
Authorization: Bearer <token>
```

**Path params:**

| Param | Type | Description |
|---|---|---|
| `alumno_id` | integer | Positive student ID |

**Response:** Binary PDF with:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="boleta-mateo-jaramillo.pdf"
```

**PDF contents:**
- Title: Boleta de calificaciones
- Student full name, group, school year
- Generation date
- Per-subject table: subject name, teacher, all 3 trimester grades, comments
- Signature status per trimester (signed or pending, date, comment)

**Behavior:**
- Generated dynamically in memory — no files stored on disk
- Reuses the same consolidated report-card logic (no SQL duplication)
- Uses built-in Helvetica fonts — no custom fonts, logos, or images
- PDF can be downloaded whether or not any trimester has been signed
- Filename is sanitized: lowercase, accents removed, spaces → hyphens

**Errors:**

| Condition | Status |
|---|---|
| Unlinked or nonexistent student | 404 Student not found |
| Invalid `alumno_id` | 400 Validation failed |
| `docente` or `admin` | 403 Forbidden |
| Missing/invalid JWT | 401 Unauthorized |

## Testing Locally

```bash
# Run the full test suite
bun run test

# Test login manually
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"password123"}'

# Test authenticated endpoint
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"

# Test teacher assignments
curl http://localhost:3000/api/web/docente/asignaciones \
  -H "Authorization: Bearer <token>"
```

## Announcements Endpoints (Teacher Web Platform)

All announcement endpoints require `authenticate` and `authorizeRoles("docente", "admin")`.

### List Announcements

Returns announcements visible to the authenticated user.

```http
GET /api/web/docente/avisos
Authorization: Bearer <token>
```

**Behavior:**

- `docente` — returns only announcements created by that teacher
- `admin` — returns all announcements (administrative override)
- `tutor` — `403 Forbidden`
- Sorted by `fecha_publicacion DESC, id DESC`

**Success response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "aviso_id": 3,
      "grupo": { "grupo_id": 1, "nombre": "1° A" },
      "remitente": {
        "usuario_id": 1,
        "nombre": "Ana",
        "apellido": "López",
        "rol": "docente"
      },
      "titulo": "Material para mañana",
      "contenido": "Traer geometría y regla.",
      "fecha_publicacion": "2026-06-03T15:00:00.000Z"
    }
  ]
}
```

**Error responses:**

| Status | Scenario |
|---|---|
| 200 | Empty list returns `{ "status": "success", "data": [] }` |
| 401 | Missing, invalid, or expired token |
| 403 | Authenticated `tutor` attempting teacher endpoint |

### Publish Announcement

Publishes a new announcement for an authorized group.

```http
POST /api/web/docente/avisos
Authorization: Bearer <token>
Content-Type: application/json

{
  "grupo_id": 1,
  "titulo": "Material para mañana",
  "contenido": "Traer geometría y regla."
}
```

**Validation rules:**

| Field | Rule |
|---|---|
| `grupo_id` | Positive integer |
| `titulo` | Trimmed string, 1–150 visible characters |
| `contenido` | Trimmed string, 1–3000 visible characters |

**Behavior:**

- `docente` — must have at least one assignment in the target group; otherwise `404 Group not found`
- `admin` — may publish to any existing group; nonexistent group returns `404 Group not found`
- `tutor` — `403 Forbidden`

**Success response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "message": "Aviso publicado",
    "aviso_id": 3
  }
}
```

**Error responses:**

| Status | Scenario |
|---|---|
| 400 | Invalid body (missing fields, validation limits exceeded, whitespace-only strings) |
| 401 | Missing, invalid, or expired token |
| 403 | Authenticated `tutor` attempting teacher endpoint |
| 404 | Group not found or teacher not authorized (generic, does not reveal which) |

**Note:** Announcements are not yet available through the mobile parent/tutor routes.

## API Endpoints

| Prefix | Description | Status |
|---|---|---|
| `/api/auth/login` | Login | Implemented |
| `/api/auth/me` | Current authenticated user | Implemented |
| `/api/web/docente/asignaciones` | Teacher assignments | Implemented |
| `/api/web/docente/grupos/:grupo_id/alumnos` | Students by group | Implemented |
| `/api/web/docente/alumnos/:alumno_id/calificaciones` | Student grade history | Implemented |
| `/api/web/docente/asignaciones/:asignacion_id/calificaciones` | Assignment grade table by trimester | Implemented |
| `POST /api/web/docente/calificaciones` | Individual grade upsert | Implemented |
| `POST /api/web/docente/calificaciones/bulk` | Bulk grade upsert | Implemented |
| `GET /api/web/docente/chats` | Teacher chat inbox | Implemented |
| `GET /api/web/docente/chats/:chat_id/mensajes` | Paginated chat messages | Implemented |
| `POST /api/web/docente/chats/:chat_id/mensajes` | Send message | Implemented |
| `GET /api/web/docente/avisos` | List announcements | Implemented |
| `POST /api/web/docente/avisos` | Publish announcement | Implemented |
| `GET /api/movil/tutor/hijos` | Linked children (tutor mobile) | Implemented |
| `GET /api/movil/tutor/hijos/:alumno_id/calificaciones` | Consolidated report card (tutor mobile) | Implemented |
| `POST /api/movil/tutor/hijos/:alumno_id/boletas/:periodo/firma` | Sign trimester report card (tutor mobile) | Implemented |
| `GET /api/movil/tutor/hijos/:alumno_id/calificaciones/pdf` | Download report card PDF (tutor mobile) | Implemented |

Any other route returns 404.

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture and coding guidelines.
