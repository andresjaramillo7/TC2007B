# Contributing to Grade Tracker Backend

## Architecture

The backend follows a **layered architecture** with clear separation of concerns:

```
src/
├── app.ts              Express app setup (middleware, routes)
├── server.ts           Entry point (listens on port)
├── config/             Environment variables and typed config
├── db/                 PostgreSQL connection pool
├── constants/          HTTP status codes, role enums
├── errors/             Custom error classes
├── middlewares/        Express middleware functions
├── routes/             Route definitions (grouped by domain)
├── controllers/        Request handlers (thin layer)
├── services/           Business logic (Phase 2)
├── models/             Database queries / repositories (Phase 2)
├── validations/        Zod validation schemas (Phase 2)
├── utils/              Helper functions (API responses, etc.)
└── types/              TypeScript type definitions
```

### Layered Architecture Rules

1. **Routes** define HTTP method + path and delegate to controllers. No business logic.
2. **Controllers** extract request data, validate, call services, and send responses. ~10 lines max.
3. **Services** contain business logic. Called by controllers. Orchestrate models and external calls.
4. **Models / Repositories** handle database queries. Only SQL lives here. Return plain data.
5. **Validations** are Zod schemas. Validated in controllers or via `validateRequest` middleware before services are called.
6. **Middlewares** handle cross-cutting concerns: auth, error handling, logging.
7. **Types** are defined in `src/types/` and colocated with domain files when specific.

### Dependency Direction

```
Routes → Controllers → Services → Models/Repositories
  ↓          ↓            ↓
Auth      Validations   Config/DB
```

Dependencies must flow **inward**. Never import a controller from a service.

---

## Code Style

- **Language:** TypeScript (strict mode)
- **Module system:** CommonJS (output from TypeScript)
- **Formatting:** Prettier (single quotes, trailing commas, 100 print width)
- **Linting:** ESLint with `@typescript-eslint/recommended`

Run before committing:
```bash
bun run lint
bun run format
bun run test
```

### Naming Conventions

- **Files:** `kebab-case` (e.g., `auth.routes.ts`, `errorHandler.ts`)
- **Classes:** `PascalCase` (e.g., `AppError`)
- **Functions/Variables:** `camelCase` (e.g., `sendSuccess`, `dbConfig`)
- **Interfaces/Types:** `PascalCase` prefixed with `I` or descriptive noun (e.g., `DbConfig`, `PaginationQuery`)
- **Constants:** `UPPER_SNAKE_CASE` for magic values (e.g., `HTTP_STATUS.OK`)

### File Structure per Domain

Each domain (auth, grades, chats, announcements, etc.) should follow this pattern when implemented:

```
src/
├── routes/
│   └── grades.routes.ts
├── controllers/
│   └── grades.controller.ts
├── services/
│   └── grades.service.ts
├── models/
│   └── grades.model.ts
└── validations/
    └── grades.validation.ts
```

---

## Error Handling

- All **operational errors** (validation failures, not found, auth failures) use `AppError` class.
- `AppError` has `statusCode` and `isOperational = true`.
- **Unexpected errors** (uncaught exceptions, programming bugs) are caught by the central error handler.
- In **production**, stack traces are hidden from API responses.
- Controllers use `next(err)` for async errors (Express 5 handles async rejections natively).

```typescript
// Example: throwing an operational error
throw new AppError('Invalid credentials', 401);

// Example: passing an unexpected error to the handler
next(err);
```

### Standard API Error Responses

| Scenario | Status | Body |
|---|---|---|
| Validation error | 400 | `{ status: "fail", message: "...", errors: [...] }` |
| Auth error | 401 | `{ status: "fail", message: "..." }` |
| Forbidden | 403 | `{ status: "fail", message: "Forbidden" }` |
| Not found | 404 | `{ status: "fail", message: "Route not found" }` |
| Server error (dev) | 500 | `{ status: "error", message: "...", stack: "..." }` |
| Server error (prod) | 500 | `{ status: "error", message: "Something went wrong" }` |
| Not implemented | 501 | `{ status: "fail", message: "... not yet implemented" }` |

---

## Security

- **Helmet** sets secure HTTP headers.
- **CORS** is configured via `CORS_ORIGIN` env var.
- **Input validation** with Zod prevents injection and malformed data.
- **SQL injection** prevented by parameterized queries (`$1`, `$2`, etc.).
- **No secrets in code.** All secrets go in `.env` (gitignored).
- **JWT authentication** via `authenticate` middleware.
- **Role authorization** via `authorizeRoles` middleware.
- **Passwords** hashed with bcryptjs.

---

## Testing

- **Framework:** Jest + Supertest
- **Test files:** `tests/*.test.ts`
- **Convention:** One `describe` block per endpoint, one `it` per scenario.
- **Mocking pattern:** Mock model functions with `jest.mock()` at the top of the test file. Mock the database connection pool if the service imports it directly.

```bash
bun run test            # Run all tests
```

### What to Test

- Controllers: status codes, response body shape, error cases.
- Middlewares: correct interception and response.
- Services: business logic with mocked models.
- Models: tested through integration tests with mocked database layer.
- Auth tests: mock `src/models/user.model.ts` with `jest.mock()` and test through Supertest.

---

## API Route Structure

```
POST /api/auth/login                  
GET  /api/auth/me                     
GET  /api/web/docente/asignaciones    
GET  /api/web/docente/grupos/:grupo_id/alumnos
GET  /api/web/docente/avisos          
POST /api/web/docente/avisos          
GET  /api/movil/tutor/hijos           
GET  /api/movil/tutor/hijos/:alumno_id/calificaciones
POST /api/movil/tutor/hijos/:alumno_id/boletas/:periodo/firma
GET  /api/movil/tutor/hijos/:alumno_id/calificaciones/pdf
...                                   
```

All endpoints use the `/api` prefix.

---

## Environment Variables

See `.env.example` for the full list. Required variables are validated at startup:

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment |
| `DB_HOST` | No | localhost | PostgreSQL host |
| `DB_PORT` | No | 5432 | PostgreSQL port |
| `DB_USER` | **Yes** | — | PostgreSQL user |
| `DB_PASSWORD` | No | '' | PostgreSQL password |
| `DB_NAME` | **Yes** | — | PostgreSQL database |
| `JWT_SECRET` | No | dev-secret | JWT signing key |
| `JWT_EXPIRES_IN` | No | 8h | JWT expiration |
| `CORS_ORIGIN` | No | * | Allowed CORS origin |

---

## Git Workflow

- Branch from `main` for new features: `git checkout -b feat/your-feature`
- Keep commits small and focused.
- Write clear commit messages in English.
- Open a PR for review before merging.
