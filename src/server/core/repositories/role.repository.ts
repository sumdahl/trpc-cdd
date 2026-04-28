import { RoleEntity } from "../entities/role.entity";
import { PermissionEntity } from "../entities/permission.entity";

export interface IRoleRepository {
  findById(id: string): Promise<RoleEntity | null>;
  findByName(name: string): Promise<RoleEntity | null>;
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ roles: RoleEntity[]; total: number }>;
  findPermissionsByRoleIds(roleIds: string[]): Promise<PermissionEntity[]>;
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;
  findRolesByUserId(userId: string): Promise<RoleEntity[]>;
  findRolesByUserIds(userIds: string[]): Promise<Map<string, RoleEntity[]>>;
  countUsersWithRole(roleId: string): Promise<number>;
}
