import {
  pgTable,
  varchar,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const roles = pgTable("roles", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: varchar("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: varchar("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: varchar("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: varchar("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.roleId, t.permissionId),
    index("role_permissions_role_id_idx").on(t.roleId),
  ],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: varchar("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.userId, t.roleId),
    index("user_roles_user_id_idx").on(t.userId),
    index("user_roles_role_id_idx").on(t.roleId),
  ],
);

export type RoleRecord = typeof roles.$inferSelect;
export type PermissionRecord = typeof permissions.$inferSelect;
export type RolePermissionRecord = typeof rolePermissions.$inferSelect;
export type UserRoleRecord = typeof userRoles.$inferSelect;
