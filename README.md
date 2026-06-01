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

# 6. Start development server
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
      "fotoUrl": null
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
      "fotoUrl": null
    }
  }
}
```

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
| `tutor@example.com` | `password123` | Carlos García | `tutor` |
| `admin@example.com` | `password123` | María Administrador | `admin` |

The seed script is safe to run multiple times — it uses `ON CONFLICT (email) DO NOTHING`.

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
```

## API Endpoints

| Prefix | Description | Status |
|---|---|---|
| `/api/auth/login` | Login | Implemented |
| `/api/auth/me` | Current authenticated user | Implemented |
| `/api/mobile` | Parent/tutor endpoints | 501 Not Implemented |
| `/api/teacher` | Teacher endpoints | 501 Not Implemented |

Any other route returns 404.

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture and coding guidelines.
