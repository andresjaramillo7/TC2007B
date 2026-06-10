# Grade Tracker Backend

Backend API for the Grade Tracker platform — a school grade management system with:

- **Mobile app** for parents/tutors — view grades, sign report cards, chat with teachers, receive announcements
- **Web platform** for teachers — manage grades, publish announcements, chat with tutors
- **Admin role** — administrative override for data inspection and management

## Features

- JWT authentication with role-based authorization (tutor, docente, admin)
- Academic data management (groups, subjects, assignments, students)
- Grade management with individual and bulk upsert
- Report card viewing, PDF download, and trimester signature (idempotent)
- Subject-scoped chat between tutors and teachers
- Group announcements with role-scoped visibility
- PostgreSQL schema with migrations
- Swagger/OpenAPI interactive documentation
- Automated test suite (Jest + Supertest)

## Tech Stack

| Category       | Technology               |
| -------------- | ------------------------ |
| Runtime        | Bun 1.x                  |
| Language       | TypeScript (strict)      |
| Framework      | Express 5                |
| Database       | PostgreSQL (via `pg`)    |
| Validation     | Zod                      |
| Authentication | JWT + bcryptjs           |
| PDF            | pdfkit                   |
| Testing        | Jest + Supertest         |
| API Docs       | OpenAPI 3.0 + Swagger UI |

## Requirements

- [Bun](https://bun.sh) 1.x
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

# 3. Create database and load schema
createdb grade_tracker
psql -d grade_tracker -f database/schema.sql

# 4. Seed data (run in order)
bun run seed
bun run seed:academic
bun run seed:grades
bun run seed:messaging
bun run seed:announcements

# 5. Generate local TLS certificate (first time only)
bun run cert

# 6. Start development server
bun run dev
```

The server starts at `https://localhost:3443`.

## Available Scripts

| Script                       | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `bun run cert`               | Generate local TLS certificate                 |
| `bun run dev`                | Start HTTPS development server with hot reload |
| `bun run tls`                | Verify TLS protocol restrictions               |
| `bun run build`              | Compile TypeScript to `dist/`                  |
| `bun run start`              | Run compiled app from `dist/`                  |
| `bun run seed`               | Insert test users                              |
| `bun run seed:academic`      | Insert groups, subjects, assignments, students |
| `bun run seed:grades`        | Insert sample grades                           |
| `bun run seed:messaging`     | Insert chats, participants, messages           |
| `bun run seed:announcements` | Insert group announcements                     |
| `bun run test`               | Run test suite (Jest)                          |
| `bun run lint`               | Run ESLint                                     |
| `bun run format`             | Format code with Prettier                      |

## Environment Variables

| Variable         | Required | Default                         | Description                                       |
| ---------------- | -------- | ------------------------------- | ------------------------------------------------- |
| `PORT`           | No       | 3000                            | Server port                                       |
| `NODE_ENV`       | No       | development                     | Environment (`development`, `production`, `test`) |
| `DB_HOST`        | No       | localhost                       | PostgreSQL host                                   |
| `DB_PORT`        | No       | 5432                            | PostgreSQL port                                   |
| `DB_USER`        | Yes      | —                               | PostgreSQL user                                   |
| `DB_PASSWORD`    | No       | ''                              | PostgreSQL password                               |
| `DB_NAME`        | Yes      | —                               | PostgreSQL database name                          |
| `JWT_SECRET`     | No       | dev-secret                      | JWT signing key                                   |
| `JWT_EXPIRES_IN` | No       | 8h                              | JWT expiration duration                           |
| `CORS_ORIGIN`    | No       | \*                              | Allowed CORS origin                               |
| `HTTPS_PORT`     | No       | 3443                            | HTTPS server port                                 |
| `TLS_KEY_PATH`   | No       | .local-certs/localhost-key.pem  | TLS private key path                              |
| `TLS_CERT_PATH`  | No       | .local-certs/localhost-cert.pem | TLS certificate path                              |

## Database Setup

Two approaches:

1. **Fresh database** — Run `database/schema.sql` which creates all tables with current constraints.
2. **Existing database** — Apply migration files in `database/migrations/` in order. Each migration is idempotent.

## API Documentation

Interactive Swagger UI is available at:

```
https://localhost:3443/api/docs
```

The OpenAPI specification documents all 22 endpoints with request bodies, response shapes, status codes, authentication, and role requirements. This is the single source of truth for the API contract.

Raw OpenAPI JSON is also available at `https://localhost:3443/api/docs.json`.

### Seed Users

| Email                  | Password         | Name                | Role    |
| ---------------------- | ---------------- | ------------------- | ------- |
| `teacher@example.com`  | `Demo_Teacher1!` | Ana López           | docente |
| `teacher2@example.com` | `Demo_Teacher2!` | Pedro Ruiz          | docente |
| `tutor@example.com`    | `Demo_Tutor123!` | Carlos García       | tutor   |
| `admin@example.com`    | `Demo_Admin123!` | María Administrador | admin   |

All seed scripts are idempotent — safe to run multiple times.

## Testing

```bash
bun run test
```

Latest validated run: **293 passed, 0 failed** (11 suites).

## HTTPS Local Development

The backend always runs through HTTPS. The primary workflow is:

```bash
bun run cert    # generate local TLS certificate (first time only)
bun run dev     # start HTTPS development server
bun run tls     # verify TLS 1.2/1.3 work and TLS 1.1 is rejected
```

The server listens on `https://localhost:3443` with TLS 1.2 minimum and TLS 1.3 maximum.

> The self-signed certificate may trigger a browser warning in local development.
> Generated certificate files under `.local-certs/` must never be committed.

## Security

See [docs/security-checklist.md](docs/security-checklist.md) for:

- Password policy and hashing
- JWT and role-based access control
- SQL Injection protection
- Audit logging
- HTTPS / TLS configuration
- PostgreSQL read-only role setup

## Project Structure

```
src/
├── app.ts                 Express app setup
├── server.ts              Entry point
├── config/                Environment config
├── constants/             Status codes, role enums
├── controllers/           Request handlers (thin layer)
├── db/                    PostgreSQL connection pool
├── errors/                Custom error classes
├── middlewares/           Auth, validation, error handling
├── models/                Database queries
├── routes/                Route definitions
├── scripts/               Seed scripts
├── services/              Business logic
├── types/                 TypeScript definitions
├── utils/                 Helper functions
└── validations/           Zod schemas
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
