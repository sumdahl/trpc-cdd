import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  roles,
  permissions,
  rolePermissions,
} from "../src/server/infrastructure/persistence/schema/rbac.schema";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL!,
});

await client.connect();
const db = drizzle(client);

console.log("Seeding roles and permissions...");

// seed permissions
const permissionList = [
  {
    id: crypto.randomUUID(),
    name: "user:read",
    description: "Read user details",
  },
  {
    id: crypto.randomUUID(),
    name: "user:update",
    description: "Update any user",
  },
  {
    id: crypto.randomUUID(),
    name: "user:delete",
    description: "Delete any user",
  },
  {
    id: crypto.randomUUID(),
    name: "profile:read",
    description: "Read own profile",
  },
  {
    id: crypto.randomUUID(),
    name: "profile:update",
    description: "Update own profile",
  },
  {
    id: crypto.randomUUID(),
    name: "role:assign",
    description: "Assign roles to users",
  },
];

await db.insert(permissions).values(permissionList).onConflictDoNothing();
console.log(`✅ ${permissionList.length} permissions seeded`);

// seed roles
const roleList = [
  {
    id: crypto.randomUUID(),
    name: "admin",
    description: "Full access to everything",
  },
  {
    id: crypto.randomUUID(),
    name: "moderator",
    description: "Can read and manage users",
  },
  { id: crypto.randomUUID(), name: "user", description: "Basic user access" },
];

await db.insert(roles).values(roleList).onConflictDoNothing();
console.log(`✅ ${roleList.length} roles seeded`);

// fetch inserted records to get actual IDs
const insertedPermissions = await db.select().from(permissions);
const insertedRoles = await db.select().from(roles);

const getPermId = (name: string) =>
  insertedPermissions.find((p) => p.name === name)!.id;
const getRoleId = (name: string) =>
  insertedRoles.find((r) => r.name === name)!.id;

// seed role_permissions
const rolePermissionList = [
  // admin gets everything
  ...permissionList.map((p) => ({
    roleId: getRoleId("admin"),
    permissionId: getPermId(p.name),
  })),
  // moderator gets user:read and user:update
  { roleId: getRoleId("moderator"), permissionId: getPermId("user:read") },
  { roleId: getRoleId("moderator"), permissionId: getPermId("user:update") },
  // user gets profile:read and profile:update
  { roleId: getRoleId("user"), permissionId: getPermId("profile:read") },
  { roleId: getRoleId("user"), permissionId: getPermId("profile:update") },
];

await db
  .insert(rolePermissions)
  .values(rolePermissionList)
  .onConflictDoNothing();
console.log(`✅ role permissions seeded`);

console.log("Seeding complete!");
await client.end();
