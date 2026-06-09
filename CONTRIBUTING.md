# Contributing to Grade Tracker Backend

## Development Workflow

1. Create a branch from `main`
2. Implement your changes following the coding standards
3. Add or update tests for new behavior
4. Update `docs/openapi.yaml` if the API contract changes
5. Update `README.md` only when setup or architecture changes
6. Run `bun run lint && bun run format && bun run test`
7. Open a pull request for review

## Commit Messages

Use Conventional Commits:

```
feat: add bulk grade endpoint
fix: prevent duplicate chat creation
docs: add Swagger documentation
test: add signature idempotency coverage
refactor: simplify report-card signature service
```

Keep commits small, focused, and in English.

## Coding Standards

### Layered Architecture

```
Routes → Controllers → Services → Models
  ↓          ↓            ↓
Auth      Validations   Config/DB
```

Dependencies flow **inward**. Never import a controller from a service.

| Layer | Responsibility |
|---|---|
| Routes | Define HTTP method + path, delegate to controllers |
| Controllers | Extract request data, validate, call services, send responses |
| Services | Business logic, orchestrate models |
| Models | Database queries (only SQL, return plain data) |
| Validations | Zod schemas, validated via `validateRequest` middleware |
| Middlewares | Cross-cutting concerns (auth, error handling) |

### Conventions

- **Files:** `kebab-case` (e.g., `auth.routes.ts`)
- **Classes:** `PascalCase`
- **Functions/Variables:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **API + DB fields:** `snake_case`
- **Formatting:** Prettier (single quotes, trailing commas, 100 print width)
- **Linting:** ESLint with `@typescript-eslint/recommended`

## Database Changes

1. Update `database/schema.sql` to reflect the new state
2. Create a migration file in `database/migrations/` named descriptively
3. Migrations must be idempotent (use `IF NOT EXISTS`, `IF EXISTS`)
4. Do not modify unrelated data or tables
5. Document how to run the migration in the file header

## Tests

- **Framework:** Jest + Supertest
- **Location:** `tests/*.test.ts`
- **Mocking:** Mock model functions with `jest.mock()` at the top of the test file
- **Convention:** One `describe` per endpoint, one `it` per scenario

```bash
bun run test
```

Test both success and error cases (valid/invalid input, unauthorized roles, nonexistent resources).

## API Documentation

Swagger is the single source of truth for the API contract.

When modifying any of the following, you **must** update `docs/openapi.yaml`:

- Route path or HTTP method
- Request body schema or validation rules
- Response shape or status codes
- Authentication or role requirements
- Query parameters or path parameters

The Swagger UI is available at `GET /api/docs`.

## Pull Request Checklist

- [ ] Code follows the layered architecture and naming conventions
- [ ] `bun run lint` passes with no errors
- [ ] `bun run format` has been applied
- [ ] `bun run test` passes (all existing + new tests)
- [ ] `docs/openapi.yaml` is updated if the API contract changed
- [ ] `README.md` is updated if setup, architecture, or environment changed
- [ ] Database migrations are added (if schema changed)
- [ ] No secrets, credentials, or hardcoded values are committed

## Reporting Bugs

Open an issue at the [repository](https://github.com/andresjaramillo7/TC2007B/issues) with:

- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Bun version, Node version)
