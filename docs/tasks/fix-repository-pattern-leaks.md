# Fix Repository Pattern Leaks via Domain Services

## Metadata
- **Priority:** Medium
- **Status:** Pending
- **Dependencies:** None — but easier to do after `add-unit-of-work-pattern.md`

## Problem
Use cases call repository methods that expose persistence-specific query shapes (e.g. `findRolesByUserIds`, `findPermissionsByRoleIds`). While not strictly a violation (repositories are meant to handle queries), this means use cases are tied to the query vocabulary of a specific repository rather than thinking in domain terms.

Additionally, the same logic (e.g. "get a user's roles") is duplicated across multiple use cases.

## Affected Use Cases
| Use Case | Repository Call | Issue |
|---|---|---|
| `LoginUseCase` | `roleRepository.findRolesByUserId(userId)` | Role loading logic duplicated |
| `GetAllUsersUseCase` | `roleRepository.findRolesByUserIds(userIds)` | Batch role loading duplicated |
| `RegisterUseCase` | `roleRepository.findByName('user')` + `assignRoleToUser` | Default role assignment logic duplicated |

## Solution: Domain Services in Core

Create focused domain services in `src/server/core/services/` that own this logic:

### `IUserRoleService` (`src/server/core/services/user-role.service.ts`)
```typescript
export interface IUserRoleService {
  assignDefaultRole(userId: string): Promise<void>;
  getRolesForUser(userId: string): Promise<RoleEntity[]>;
  getRolesForUsers(userIds: string[]): Promise<Map<string, RoleEntity[]>>;
}
```

### `IRolePermissionService` (`src/server/core/services/role-permission.service.ts`)
```typescript
export interface IRolePermissionService {
  getPermissionsForRoles(roleIds: string[]): Promise<PermissionEntity[]>;
}
```

Implementations live in `src/server/infrastructure/services/`:
- `UserRoleService` — implements `IUserRoleService`, depends on `IRoleRepository`
- `RolePermissionService` — implements `IRolePermissionService`, depends on `IRoleRepository`

### DI Registration
```typescript
userRoleService: asClass(UserRoleService).singleton(),
rolePermissionService: asClass(RolePermissionService).singleton(),
```

Add to `Cradle` with **interface types**:
```typescript
userRoleService: IUserRoleService;
rolePermissionService: IRolePermissionService;
```

## Files to Create
- `src/server/core/services/user-role.service.ts` (interface)
- `src/server/core/services/role-permission.service.ts` (interface)
- `src/server/infrastructure/services/user-role.service.ts` (implementation)
- `src/server/infrastructure/services/role-permission.service.ts` (implementation)

## Files to Modify
- `src/server/core/use-cases/auth/login.ts` — use `IUserRoleService.getRolesForUser()`
- `src/server/core/use-cases/auth/register.ts` — use `IUserRoleService.assignDefaultRole()`
- `src/server/core/use-cases/admin/get-all-users.ts` — use `IUserRoleService.getRolesForUsers()`
- `src/server/infrastructure/di/container.ts` — register new services
- `src/server/infrastructure/di/types.ts` — add to Cradle

## Acceptance Criteria
- [ ] `IUserRoleService` and `IRolePermissionService` defined in core (no infrastructure imports)
- [ ] Implementations in infrastructure implementing the core interfaces
- [ ] `LoginUseCase`, `RegisterUseCase`, `GetAllUsersUseCase` updated to use domain services
- [ ] No direct `roleRepository.findRolesByUserId` / `findRolesByUserIds` calls in use cases
- [ ] Cradle updated with interface types (not concrete implementations)
- [ ] Unit tests updated — mock `IUserRoleService` instead of `IRoleRepository` where applicable
- [ ] `bun run build` passes
- [ ] `bun test` passes with no regressions
