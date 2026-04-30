# Add Unit of Work Pattern

## Metadata
- **Priority:** Medium
- **Status:** Pending
- **Dependencies:** None — but `fix-email-fire-and-forget.md` (outbox variant) benefits from this

## Problem
Use cases that perform multiple repository writes have no transactional safety:

- `RegisterUseCase`: creates user → assigns default role → creates verification token
  - If role assignment fails, a user exists with no role
  - If token creation fails, user exists but can never verify email
- `ResetPasswordUseCase`: updates password → deletes token
  - Partial failure leaves stale reset tokens

None of these multi-step operations are wrapped in a database transaction.

## Solution: `IUnitOfWorkFactory` in Core + `PostgresUnitOfWork` in Infrastructure

### Core Layer (`src/server/core/shared/`)

**`i-unit-of-work.ts`** — defines the interface:
```typescript
export interface IUnitOfWork {
  userRepository: IUserRepository;
  tokenRepository: ITokenRepository;
  verificationTokenRepository: IVerificationTokenRepository;
  passwordResetTokenRepository: IPasswordResetTokenRepository;
  roleRepository: IRoleRepository;
}

export interface IUnitOfWorkFactory {
  run<T>(work: (uow: IUnitOfWork) => Promise<T>): Promise<T>;
}
```

### Infrastructure Layer (`src/server/infrastructure/persistence/`)

**`postgres-unit-of-work.ts`** — wraps Drizzle's `db.transaction()`:
```typescript
export class PostgresUnitOfWorkFactory implements IUnitOfWorkFactory {
  constructor(private readonly db: DB) {}

  async run<T>(work: (uow: IUnitOfWork) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      const uow: IUnitOfWork = {
        userRepository: new PostgresUserRepository(tx),
        tokenRepository: new PostgresTokenRepository(tx),
        verificationTokenRepository: new PostgresVerificationTokenRepository(tx),
        passwordResetTokenRepository: new PostgresPasswordResetTokenRepository(tx),
        roleRepository: new PostgresRoleRepository(tx),
      };
      return work(uow);
      // Drizzle auto-commits on return, auto-rolls back on throw
    });
  }
}
```

### DI Registration (`src/server/infrastructure/di/`)

```typescript
unitOfWorkFactory: asClass(PostgresUnitOfWorkFactory).singleton()
```

Add `unitOfWorkFactory: IUnitOfWorkFactory` to `Cradle` in `types.ts`.

### Use Case Update (example — `RegisterUseCase`)

```typescript
constructor(
  private readonly unitOfWorkFactory: IUnitOfWorkFactory,
  private readonly emailService: IEmailService,
) {}

async execute(data) {
  const user = await this.unitOfWorkFactory.run(async (uow) => {
    const existing = await uow.userRepository.findByEmail(data.email);
    if (existing) throw new AppError(ErrorCode.EMAIL_TAKEN, '...', 409);

    const user = await uow.userRepository.create({ ... });
    const token = crypto.randomUUID();
    await uow.verificationTokenRepository.save(user.id, token, expiresAt);
    const role = await uow.roleRepository.findByName('user');
    if (role) await uow.roleRepository.assignRoleToUser(user.id, role.id);
    return user;
  });

  // Email sent AFTER commit — not inside the transaction
  await this.emailService.sendVerificationEmail(user.email, token);
  return user;
}
```

## Files to Create
- `src/server/core/shared/i-unit-of-work.ts`
- `src/server/infrastructure/persistence/postgres-unit-of-work.ts`

## Files to Modify
- `src/server/infrastructure/di/container.ts` — register `unitOfWorkFactory`
- `src/server/infrastructure/di/types.ts` — add `unitOfWorkFactory: IUnitOfWorkFactory` to Cradle
- `src/server/core/use-cases/auth/register.ts` — use UoW
- `src/server/core/use-cases/auth/reset-password.ts` — use UoW
- Possibly: `verify-email.ts`, `resend-verification.ts`

## Acceptance Criteria
- [ ] `IUnitOfWorkFactory` and `IUnitOfWork` defined in core (no infrastructure imports)
- [ ] `PostgresUnitOfWorkFactory` implements `IUnitOfWorkFactory` using Drizzle transactions
- [ ] `RegisterUseCase` uses `IUnitOfWorkFactory` — partial failures roll back the full operation
- [ ] `ResetPasswordUseCase` uses `IUnitOfWorkFactory`
- [ ] `Cradle` updated with `unitOfWorkFactory: IUnitOfWorkFactory` (interface type, not concrete)
- [ ] Existing repository constructors accept either `DB` or Drizzle transaction type
- [ ] Unit tests updated to mock `IUnitOfWorkFactory`
- [ ] `bun run build` passes
- [ ] `bun test` passes with no regressions
