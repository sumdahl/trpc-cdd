# Fix AppContext Typing

## Metadata
- **Priority:** High
- **Status:** Pending
- **Dependencies:** None — this is the foundational fix

## Problem
`AppContext.Variables` in `src/server/infrastructure/http/types/context.ts` declares `roles`, `permissions`, `jti`, and `exp` as **required** (non-optional). However, on public routes where `authMiddleware` never runs, these values are `undefined` at runtime — TypeScript lies about their presence.

Additionally, `email` is declared as `email?: string` (correctly optional) but is **never set** in `authMiddleware` despite being extracted from the JWT payload. It will always be `undefined`.

## Current State
```
Variables: {
  requestId: string;
  userId?: string;      // ✅ optional
  email?: string;       // ✅ optional — but NEVER SET in authMiddleware
  roles: string[];      // ❌ required — undefined on public routes
  permissions: string[];// ❌ required — undefined on public routes
  jti: string;          // ❌ required — undefined on public routes
  exp: number;          // ❌ required — undefined on public routes
}
```

## Required Changes

### 1. `src/server/infrastructure/http/types/context.ts`
Make all auth-dependent variables optional:
- `roles?: string[]`
- `permissions?: string[]`
- `jti?: string`
- `exp?: number`

### 2. `src/server/infrastructure/http/middleware/auth.middleware.ts`
Add the missing `c.set("email", payload.email)` call after token verification succeeds.

### 3. Downstream guards
Audit all `c.get("roles")`, `c.get("permissions")`, `c.get("jti")`, `c.get("exp")` calls:
- `requireRole` — already guards with `?? []` ✅
- `requirePermission` — already guards with `?? []` ✅
- `requireOwnership` — already guards with `?? []` ✅
- `logoutRoute` handler — passes `jti` and `exp` directly to use case; must handle `undefined` (only runs after `authMiddleware`, so safe — but TypeScript will now correctly enforce it)
- `loadPermissions` — already guards with `?? []` ✅

## Acceptance Criteria
- [ ] All auth-dependent `AppContext.Variables` fields are optional (`?`)
- [ ] `authMiddleware` sets `email` from JWT payload
- [ ] TypeScript compiles cleanly with no errors
- [ ] Public routes (register, login, health) compile and run without type errors
- [ ] Protected routes (me, admin) still have proper type safety via non-null assertion or guard after `authMiddleware`
- [ ] `bun run build` passes
- [ ] `bun test` passes with no regressions
