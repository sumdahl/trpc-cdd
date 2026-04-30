# Contract-Driven API Development - Project Context

This project implements a production-grade REST API using Clean (Hexagonal) Architecture with contract-driven development.

## Key Architectural Principles
- **Strict Layer Separation**: Core domain layer has zero dependencies on infrastructure
- **Dependency Injection**: Awilix container manages all dependencies with typed Cradle
- **Contract-First**: Zod schemas drive validation, serialization, and OpenAPI documentation
- **Use Case Interactor Pattern**: Each business operation is a single, focused class
- **Repository Pattern**: Interfaces in core, implementations in infrastructure
- **Domain Model**: Pure entities with no infrastructure concerns
- **Error Handling**: Typed domain errors with centralized HTTP mapping
- **Testing Strategy**: Unit tests with in-memory mocks, integration tests for HTTP flows

## Current Implementation Details
- **Runtime**: Bun (fast JavaScript/TypeScript runtime)
- **Web Framework**: Hono with @hono/zod-openapi for contract-first API development
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Authentication**: JWT access/refresh tokens with rotation, Redis-based token blacklisting
- **Authorization**: Role-Based Access Control (RBAC) with permissions
- **Email**: Resend service for transactional emails
- **Validation**: Zod schemas as single source of truth
- **Documentation**: Auto-generated OpenAPI spec served at /openapi.json
- **API Versioning**: /api/v1/ prefix for all endpoints
- **Response Format**: Consistent { success: true, data?: T, message?: string } envelope
- **Error Format**: Consistent { success: false, error: { code: string, message: string, details?: unknown } }

## Implemented Features
- **Authentication**: User registration, email verification, login, logout, token refresh
- **Password Reset**: Secure token-based reset flow with expiration
- **Email Verification**: Required before login, with resend capability
- **RBAC System**: Roles, permissions, user-role assignments with seed data
- **Admin Endpoints**: User and role management (admin-only)
- **Health Checks**: Deep health check verifying database connectivity
- **Rate Limiting**: Two distinct systems — (1) HTTP-level per-IP rate limiting via `rateLimiter` middleware (in-memory), (2) domain-level attempt limiting via `IRateLimiterService` used in use cases (e.g. forgot-password, resend-verification)
- **Request Tracking**: Unique request ID (UUID) set per request via `requestLogger` middleware, exposed as `X-Request-Id` response header
- **Security**: Bcrypt password hashing, JWT validation, CORS, security headers

## Development Conventions
- **File Organization**: Group by feature within layers (auth, admin, etc.)
- **Naming**:
  - Interfaces: IPrefix (IUserRepository)
  - Implementations: TechPrefix (PostgresUserRepository)
  - Entities: EntitySuffix (UserEntity)
  - Use Cases: UseCaseSuffix (RegisterUseCase)
  - Schemas: SchemaSuffix (registerSchema)
- **Error Handling**:
  - AppError with ErrorCode const map for all domain errors
  - ErrorCode must be used in ALL layers — including infrastructure middleware (never raw strings)
  - Centralized error handler middleware
  - Consistent HTTP status code mapping
- **Testing**:
  - Unit tests: Pure business logic with mocks
  - Integration tests: Full HTTP request/response flow
  - Location: tests/unit/ and tests/integration/
  - Mocks: tests/mocks/ for in-memory repository implementations
- **Dependency Injection**:
  - Container: src/server/infrastructure/di/container.ts
  - Types: src/server/infrastructure/di/types.ts (Cradle interface)
  - Cradle MUST declare interface types (IUserRepository, IEmailService, etc.) — not concrete implementations
  - Registration: asClass() for services, asValue() for instances
- **Auth Middleware Chain**:
  - `authMiddleware` sets userId, email, roles, jti, exp on context
  - `loadPermissions` must be applied after `authMiddleware` to populate permissions
  - Chain order: `authMiddleware` → `loadPermissions` → `requireRole / requirePermission`
  - AppContext auth variables (userId, email, roles, permissions, jti, exp) are ALL optional — public routes never set them
- **Validation**:
  - Zod schemas alongside routes
  - Automatic validation via OpenAPIHono defaultHook
  - Response schemas must match what use cases actually return (e.g. if login returns roles, userResponseSchema must include roles)
  - Reusable schemas where possible (userResponseSchema, etc.)
- **Database**:
  - Drizzle ORM with PostgreSQL driver
  - Schema: src/server/infrastructure/persistence/schema/
  - Migrations: bun db:generate && bun db:migrate
  - Seeding: bun db:seed (after migrations)

## Current Bugs (Verified — Must Fix)

1. **`loadPermissions` middleware never wired**: Exists at `infrastructure/http/middleware/load-permissions.middleware.ts` but is never applied in `server/index.ts` or any route. `c.get("permissions")` is always `undefined` at runtime — `requirePermission()` is permanently broken.

2. **`email` context variable never set**: `authMiddleware` extracts `payload.email` from the JWT but never calls `c.set("email", payload.email)`. `AppContext` declares `email?: string` but it is always `undefined`.

3. **`AppContext` types incorrect**: `roles: string[]`, `permissions: string[]`, `jti: string`, and `exp: number` are required (non-optional) in `AppContext.Variables`, but on public routes where `authMiddleware` never runs, these will be `undefined` at runtime. All auth-dependent context variables must be optional (`?`).

4. **Integration test `createAuthRouter` missing 2 arguments**: `tests/integration/auth/auth.routes.test.ts` calls `createAuthRouter(...)` with 7 arguments, but the function signature requires 9. `ForgotPasswordUseCase` and `ResetPasswordUseCase` are missing — this is a TypeScript error.

5. **Rate limiter uses raw error code string**: `infrastructure/http/middleware/rate-limiter.ts` passes `"RATE_LIMIT_EXCEEDED"` (a raw string not in `ErrorCode`) to `formatError`. Must use `ErrorCode.TOO_MANY_REQUESTS`.

6. **`auth.schemas.ts` `userResponseSchema` missing `roles`**: `LoginUseCase` returns `{ id, email, name, roles }` in the user object, but `userResponseSchema` in `auth.schemas.ts` only declares `{ id, email, name }`. The declared schema does not match the actual response.

7. **Dead import in `container.ts`**: `TokenExpiredError` is imported from `jsonwebtoken` but never used.

8. **`requireOwnership` uses `any` type**: The `getResourceUserId` parameter in `requireOwnership` is typed as `(c: any) => string`. Must use `Context<AppContext>` instead.

## Current Technical Debt (Non-Blocking)

1. **Cradle uses concrete types**: `infrastructure/di/types.ts` declares Cradle properties with concrete implementations (e.g. `PostgresUserRepository`) instead of interfaces (`IUserRepository`). This couples the DI type layer to specific adapters.

2. **Admin test coverage**: All 6 admin use cases (`AssignRoleUseCase`, `RemoveRoleUseCase`, `DeleteUserUseCase`, `GetAllUsersUseCase`, `GetUserByIdUseCase`, `GetAllRolesUseCase`) have zero unit tests. `tests/integration/admin/` folder is completely empty.

3. **Auth integration test coverage**: `auth.routes.test.ts` only covers `register` and `login`. Missing: `/logout`, `/me`, `/refresh`, `/forgot-password`, `/reset-password`, `/resend-verification`.

4. **Transaction Support**: No unit of work pattern for multi-repository operations (e.g. register creates user + verification token in separate calls with no rollback).

5. **Email Reliability**: Fire-and-forget email sending without transactional guarantee.

6. **External Service Resilience**: No circuit breakers for email/Redis services.

7. **Domain Events**: Business logic triggers side effects directly instead of event publishing.

8. **Logging Context**: Logs could be enriched with more domain context (userId, operation type).

9. **Rate Limiter**: `IRateLimiterService` has no Redis-backed implementation — only in-memory, which does not survive restarts or scale across multiple instances.

## Improvement Priorities (Ordered)

### Immediate (Bug Fixes)
1. Wire `loadPermissions` after `authMiddleware` in `server/index.ts`
2. Set `email` context variable in `authMiddleware`
3. Make all auth-dependent `AppContext` variables optional
4. Fix integration test — add missing `ForgotPasswordUseCase` and `ResetPasswordUseCase`
5. Replace `"RATE_LIMIT_EXCEEDED"` with `ErrorCode.TOO_MANY_REQUESTS` in rate-limiter middleware
6. Add `roles` to `auth.schemas.ts` `userResponseSchema`
7. Remove dead `TokenExpiredError` import from `container.ts`
8. Replace `any` with `Context<AppContext>` in `requireOwnership`

### Short-Term (Architecture & Quality)
9. Fix Cradle to use interface types for repositories and services
10. Write admin unit tests (all 6 use cases)
11. Write admin integration tests
12. Expand auth integration tests to cover all routes

### Medium-Term (Resilience & Patterns)
13. Add Redis-backed `IRateLimiterService` implementation
14. Add transactional outbox pattern for email reliability
15. Add domain events for loose coupling of side effects
16. Implement unit of work pattern for cross-repository transactions
17. Add circuit breaker pattern for external service resilience
