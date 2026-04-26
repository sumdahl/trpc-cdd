import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { AppContext } from "../types/context";
import { container } from "../../di/container";

export const loadPermissions: MiddlewareHandler<AppContext> = createMiddleware(
  async (c, next) => {
    const roles = c.get("roles") ?? [];

    if (roles.length === 0) {
      c.set("permissions", []);
      await next();
      return;
    }

    const { roleRepository } = container.cradle;

    // fetch role ids for the user's role names
    const allRoles = await roleRepository.findAll();
    const userRoleIds = allRoles
      .filter((r) => roles.includes(r.name))
      .map((r) => r.id);

    // fetch permissions for those role ids
    const permissions =
      await roleRepository.findPermissionsByRoleIds(userRoleIds);
    const permissionNames = [...new Set(permissions.map((p) => p.name))];

    c.set("permissions", permissionNames);

    await next();
  },
);
