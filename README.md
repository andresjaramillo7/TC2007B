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

# 3. Start development server
bun run dev
```

The server starts at `http://localhost:3000`.

## Available Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start development server with hot reload via Bun |
| `bun run build` | Compile TypeScript to `dist/` |
| `bun run start` | Run compiled app from `dist/` |
| `bun run test` | Run tests |
| `bun run lint` | Run ESLint |
| `bun run format` | Format code with Prettier |

## Project Structure

```
src/
├── app.ts               Express app configuration
├── server.ts            Entry point
├── config/              Environment variable validation
├── db/                  PostgreSQL connection pool
├── constants/           HTTP status codes, roles
├── errors/              Custom error classes
├── middlewares/         Express middleware
├── routes/              Route definitions
├── controllers/         Request handlers (Phase 2)
├── services/            Business logic (Phase 2)
├── models/              Database queries (Phase 2)
├── validations/         Zod schemas (Phase 2)
├── utils/               Helper functions
└── types/               TypeScript type definitions
```

## API Endpoints (Phase 1)

| Prefix | Description | Status |
|---|---|---|
| `/api/auth` | Authentication | 501 Not Implemented |
| `/api/mobile` | Parent/tutor endpoints | 501 Not Implemented |
| `/api/teacher` | Teacher endpoints | 501 Not Implemented |

Any other route returns 404.

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture and coding guidelines.