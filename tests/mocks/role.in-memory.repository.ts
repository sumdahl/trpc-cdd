import { IRoleRepository } from "../../src/server/core/repositories/role.repository";
import { RoleEntity } from "../../src/server/core/entities/role.entity";
import { PermissionEntity } from "../../src/server/core/entities/permission.entity";

export class InMemoryRoleRepository implements IRoleRepository {
  private roles: RoleEntity[] = [
    new RoleEntity(
      crypto.randomUUID(),
      "user",
      "Basic user access",
      new Date(),
    ),
    new RoleEntity(crypto.randomUUID(), "admin", "Full access", new Date()),
    new RoleEntity(
      crypto.randomUUID(),
      "moderator",
      "Moderator access",
      new Date(),
    ),
  ];

  private userRoles: { userId: string; roleId: string }[] = [];

  async findById(id: string): Promise<RoleEntity | null> {
    return this.roles.find((r) => r.id === id) ?? null;
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    return this.roles.find((r) => r.name === name) ?? null;
  }

  async findAll(): Promise<RoleEntity[]> {
    return this.roles;
  }

  async findPermissionsByRoleIds(
    roleIds: string[],
  ): Promise<PermissionEntity[]> {
    return [];
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const exists = this.userRoles.find(
      (ur) => ur.userId === userId && ur.roleId === roleId,
    );
    if (!exists) {
      this.userRoles.push({ userId, roleId });
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    this.userRoles = this.userRoles.filter(
      (ur) => !(ur.userId === userId && ur.roleId === roleId),
    );
  }

  async findRolesByUserId(userId: string): Promise<RoleEntity[]> {
    const roleIds = this.userRoles
      .filter((ur) => ur.userId === userId)
      .map((ur) => ur.roleId);
    return this.roles.filter((r) => roleIds.includes(r.id));
  }

  async countUsersWithRole(roleId: string): Promise<number> {
    return this.userRoles.filter((ur) => ur.roleId === roleId).length;
  }
}
