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

# 7. Start development server
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
| `docente` | Teacher — can manage grades for assigned groups |
| `tutor` | Parent/tutor — can view children's grades and sign off |
| `admin` | Administrator — reserved for future use |

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

Run `psql -d grade_tracker -f database/schema.sql` to apply.

## API Field Convention

All API request and response fields should use **snake_case**.

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

## API Endpoints

| Prefix | Description | Status |
|---|---|---|
| `/api/auth/login` | Login | Implemented |
| `/api/auth/me` | Current authenticated user | Implemented |
| `/api/web/docente/asignaciones` | Teacher assignments | Implemented |
| `/api/web/docente/grupos/:grupo_id/alumnos` | Students by group | Implemented |
| `/api/mobile` | Parent/tutor endpoints | 501 Not Implemented |

Any other route returns 404.

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture and coding guidelines.
