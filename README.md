# contract-driven-api-development

A production-grade REST API boilerplate built with **Bun + Hono + Drizzle + PostgreSQL**, following Clean Architecture principles.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Framework | Hono + @hono/zod-openapi |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Docker) |
| Validation | Zod v4 |
| Auth | JWT (access + refresh tokens) |
| Testing | Bun test runner |

## Architecture

```
src/server/
├── core/                        # Framework-agnostic business logic
│   ├── entities/                # Plain TS classes
│   ├── repositories/            # Interfaces only
│   └── use-cases/               # One file per use case
└── infrastructure/
    ├── db/                      # Drizzle client
    ├── persistence/             # DB implementations
    │   └── schema/              # Drizzle schemas
    └── http/                    # Hono routes + middleware
```

**Dependency rule:** `core` never depends on `infrastructure`. Swap DB by changing one file.

## API

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me       ← protected

GET    /api/v1/health

GET    /docs                 ← Swagger UI
GET    /openapi.json
```

## Getting Started

**Prerequisites:** Bun, Docker (Colima on macOS)

```bash
# Clone and install
git clone https://github.com/sumdahl/trpc-cdd
cd contract-driven-api-development
bun install

# Environment
cp .env.example .env

# Start database
docker compose up -d

# Migrate
bun db:generate
bun db:migrate

# Run
bun dev
```

## Scripts

```bash
bun dev              # development with watch
bun start            # production
bun test             # run all tests
bun test --watch     # watch mode
bun test --coverage  # coverage
bun db:generate      # generate migrations
bun db:migrate       # apply migrations
bun db:studio        # Drizzle Studio
bun build            # build for production
```

## Environment Variables

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cdd
PORT=8000
NODE_ENV=development
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## Tests

```
23 pass / 0 fail across 9 files

unit/
  ├── use-cases/auth/    (register, login, refresh, logout, me)
  └── use-cases/todos/   (get-all, create)

integration/
  ├── auth/              (register, login, validation, 401)
  └── todos/             (get, post, validation)
```

## License

ISC
