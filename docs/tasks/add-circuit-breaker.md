# Add Circuit Breaker for External Services

## Metadata
- **Priority:** Medium
- **Status:** Pending
- **Dependencies:** None — can be done independently

## Problem
External services (Resend email, Redis) can fail or become slow. Current behavior:

- **Email**: failures are silently swallowed (fire-and-forget `.catch`) — being fixed separately in `fix-email-fire-and-forget.md`
- **Redis token blacklist**: `isBlacklisted()` currently has no fallback — if Redis is down, the check throws, the `authMiddleware` crashes, and all protected routes become unavailable (fail-closed by accident, not by design)
- No visibility into repeated external service failures
- No automatic recovery detection

## Solution

### Library
Use `opossum` — a battle-tested Node.js circuit breaker library with TypeScript support.

```
bun add opossum
bun add -d @types/opossum
```

### Architecture
Create a reusable `CircuitBreakerService` wrapper in `infrastructure/services/`:

```typescript
// src/server/infrastructure/services/circuit-breaker.service.ts
import CircuitBreaker from 'opossum';

export function createCircuitBreaker<T>(
  fn: (...args: unknown[]) => Promise<T>,
  options?: CircuitBreaker.Options
): CircuitBreaker {
  return new CircuitBreaker(fn, {
    timeout: 3000,          // 3s timeout
    errorThresholdPercentage: 50,
    resetTimeout: 30000,    // 30s before retry
    ...options,
  });
}
```

### Email Service
Wrap `ResendEmailService` send calls in a circuit breaker:
- **Circuit open:** throw `AppError(ErrorCode.EMAIL_SEND_FAILED, ..., 503)`
- Log state changes: `breaker.on('open', ...)`, `breaker.on('halfOpen', ...)`, `breaker.on('close', ...)`

### Redis Token Blacklist Service
Two operations with different failure semantics:

| Operation | Circuit Open Behaviour | Rationale |
|---|---|---|
| `isBlacklisted(jti)` | **Fail closed** — treat as blacklisted, return `true` | Security: deny access rather than allow potentially revoked tokens |
| `blacklist(jti, ttl)` | **Log + continue** — skip blacklisting, log WARN | Availability: logout should not hard-fail; token expires naturally |

> ⚠️ The fail-closed `isBlacklisted` strategy means users cannot access protected routes when Redis is down. This is the correct security posture for a token blacklist.

## Files to Create
- `src/server/infrastructure/services/circuit-breaker.service.ts`

## Files to Modify
- `src/server/infrastructure/email/resend.email.service.ts`
- `src/server/infrastructure/services/redis-token-blacklist.service.ts`
- `package.json` — add `opossum`

## Acceptance Criteria
- [ ] `opossum` installed and typed
- [ ] `ResendEmailService` wrapped with circuit breaker — open state throws `AppError(ErrorCode.EMAIL_SEND_FAILED)`
- [ ] `RedisTokenBlacklistService.isBlacklisted()` fails closed when circuit is open
- [ ] `RedisTokenBlacklistService.blacklist()` logs and continues when circuit is open
- [ ] Circuit state transitions logged via structured logger (`logger.warn` / `logger.error`)
- [ ] Unit tests cover open-circuit fallback behaviour for both services
- [ ] `bun run build` passes
- [ ] `bun test` passes with no regressions
