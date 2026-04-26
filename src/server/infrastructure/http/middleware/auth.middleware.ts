import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import { AppError, ErrorCode } from "../../../core/errors";
import { AppContext } from "../types/context";

type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
};

export const authMiddleware: MiddlewareHandler<AppContext> = createMiddleware(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Missing or invalid authorization header",
        401,
      );
    }

    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      c.set("userId", payload.sub);
      c.set("roles", payload.roles ?? []);
    } catch {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Invalid or expired access token",
        401,
      );
    }

    await next();
  },
);

export const requireRole = (
  ...requiredRoles: string[]
): MiddlewareHandler<AppContext> =>
  createMiddleware(async (c, next) => {
    const userRoles = c.get("roles") ?? [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new AppError(ErrorCode.FORBIDDEN, "Insufficient role", 403);
    }
    await next();
  });

export const requirePermission = (
  ...requiredPermissions: string[]
): MiddlewareHandler<AppContext> =>
  createMiddleware(async (c, next) => {
    const userPermissions = c.get("permissions") ?? [];
    const hasPermission = requiredPermissions.every((p) =>
      userPermissions.includes(p),
    );
    if (!hasPermission) {
      throw new AppError(ErrorCode.FORBIDDEN, "Insufficient permissions", 403);
    }
    await next();
  });

export const requireOwnership = (
  getResourceUserId: (c: any) => string,
): MiddlewareHandler<AppContext> =>
  createMiddleware(async (c, next) => {
    const userId = c.get("userId");
    const resourceUserId = getResourceUserId(c);
    const userRoles = c.get("roles") ?? [];

    if (userId !== resourceUserId && !userRoles.includes("admin")) {
      throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
    }

    await next();
  });
