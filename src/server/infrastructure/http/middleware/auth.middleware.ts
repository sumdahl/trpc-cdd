// @.rules
import { Context, MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import { AppError, ErrorCode } from "../../../core/errors";
import { AppContext } from "../types/context";
import { container } from "../../di/container";

type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  jti: string;
  exp: number;
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
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    } catch {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Invalid or expired access token",
        401,
      );
    }

    if (payload.jti) {
      const { tokenBlacklistService } = container.cradle;
      const blacklisted = await tokenBlacklistService.isBlacklisted(
        payload.jti,
      );
      if (blacklisted) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "Token has been revoked",
          401,
        );
      }
    }

    // verify user still exists in DB
    const { userRepository } = container.cradle;
    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "User no longer exists", 401);
    }

    c.set("userId", payload.sub);
    c.set("email", payload.email);
    c.set("roles", payload.roles ?? []);
    c.set("jti", payload.jti);
    c.set("exp", payload.exp);

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
  getResourceUserId: (c: Context<AppContext>) => string,
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
