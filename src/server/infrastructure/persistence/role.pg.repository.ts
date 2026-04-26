import { eq, inArray } from "drizzle-orm";
import { DB } from "../db";
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
} from "./schema/rbac.schema";
import { IRoleRepository } from "../../core/repositories/role.repository";
import { RoleEntity } from "../../core/entities/role.entity";
import { PermissionEntity } from "../../core/entities/permission.entity";
import { AppError, ErrorCode } from "../../core/errors";
import { logger } from "../logger";

export class PostgresRoleRepository implements IRoleRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<RoleEntity | null> {
    try {
      const [row] = await this.db.select().from(roles).where(eq(roles.id, id));
      if (!row) return null;
      return new RoleEntity(row.id, row.name, row.description, row.createdAt);
    } catch (err) {
      logger.error({ err }, "[DB] findById role failed");
      throw new AppError(ErrorCode.DB_ERROR, "Failed to find role", 500);
    }
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    try {
      const [row] = await this.db
        .select()
        .from(roles)
        .where(eq(roles.name, name));
      if (!row) return null;
      return new RoleEntity(row.id, row.name, row.description, row.createdAt);
    } catch (err) {
      logger.error({ err }, "[DB] findByName role failed");
      throw new AppError(ErrorCode.DB_ERROR, "Failed to find role", 500);
    }
  }

  async findAll(): Promise<RoleEntity[]> {
    try {
      const rows = await this.db.select().from(roles);
      return rows.map(
        (r) => new RoleEntity(r.id, r.name, r.description, r.createdAt),
      );
    } catch (err) {
      logger.error({ err }, "[DB] findAll roles failed");
      throw new AppError(ErrorCode.DB_ERROR, "Failed to find roles", 500);
    }
  }

  async findPermissionsByRoleIds(
    roleIds: string[],
  ): Promise<PermissionEntity[]> {
    try {
      if (roleIds.length === 0) return [];
      const rows = await this.db
        .select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(inArray(rolePermissions.roleId, roleIds));
      return rows.map(
        ({ permission: p }) =>
          new PermissionEntity(p.id, p.name, p.description, p.createdAt),
      );
    } catch (err) {
      logger.error({ err }, "[DB] findPermissionsByRoleIds failed");
      throw new AppError(ErrorCode.DB_ERROR, "Failed to find permissions", 500);
    }
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    try {
      await this.db
        .insert(userRoles)
        .values({ userId, roleId })
        .onConflictDoNothing();
    } catch (err) {
      logger.error({ err }, "[DB] assignRoleToUser failed");
      throw new AppError(ErrorCode.DB_ERROR, "Failed to assign role", 500);
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      await this.db.delete(userRoles).where(eq(userRoles.userId, userId));
    } catch (err) {
      logger.error({ err }, "[DB] removeRoleFromUser failed");
      throw new AppError(ErrorCode.DB_ERROR, "Failed to remove role", 500);
    }
  }

  async findRolesByUserId(userId: string): Promise<RoleEntity[]> {
    try {
      const rows = await this.db
        .select({ role: roles })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));
      return rows.map(
        ({ role: r }) =>
          new RoleEntity(r.id, r.name, r.description, r.createdAt),
      );
    } catch (err) {
      logger.error({ err }, "[DB] findRolesByUserId failed");
      throw new AppError(ErrorCode.DB_ERROR, "Failed to find user roles", 500);
    }
  }
}
