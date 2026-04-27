import { RoleEntity } from "../entities/role.entity";
import { PermissionEntity } from "../entities/permission.entity";

export interface IRoleRepository {
  findById(id: string): Promise<RoleEntity | null>;
  findByName(name: string): Promise<RoleEntity | null>;
  findAll(): Promise<RoleEntity[]>;
  findPermissionsByRoleIds(roleIds: string[]): Promise<PermissionEntity[]>;
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;
  findRolesByUserId(userId: string): Promise<RoleEntity[]>;
  countUsersWithRole(roleId: string): Promise<number>;
}
