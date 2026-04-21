import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { RegisterUseCase } from "../../../core/use-cases/auth/register";
import { LoginUseCase } from "../../../core/use-cases/auth/login";
import { RefreshUseCase } from "../../../core/use-cases/auth/refresh";
import { LogoutUseCase } from "../../../core/use-cases/auth/logout";
import { MeUseCase } from "../../../core/use-cases/auth/me";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  authResponseSchema,
  accessTokenResponseSchema,
  userResponseSchema,
} from "./auth.schemas";
import { authMiddleware } from "../middleware/auth.middleware";

export function createAuthRouter(
  register: RegisterUseCase,
  login: LoginUseCase,
  refresh: RefreshUseCase,
  logout: LogoutUseCase,
  me: MeUseCase,
) {
  const router = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request data",
              details: result.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
              })),
            },
          },
          422,
        );
      }
    },
  });

  const registerRoute = createRoute({
    method: "post",
    path: "/register",
    tags: ["Auth"],
    description: "Register a new user",
    request: {
      body: { content: { "application/json": { schema: registerSchema } } },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: z.object({ user: userResponseSchema }),
          },
        },
        description: "User registered successfully",
      },
    },
  });

  const loginRoute = createRoute({
    method: "post",
    path: "/login",
    tags: ["Auth"],
    description: "Login with email and password",
    request: {
      body: { content: { "application/json": { schema: loginSchema } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: authResponseSchema } },
        description: "Login successful",
      },
    },
  });

  const refreshRoute = createRoute({
    method: "post",
    path: "/refresh",
    tags: ["Auth"],
    description: "Refresh access token",
    request: {
      body: { content: { "application/json": { schema: refreshSchema } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: accessTokenResponseSchema } },
        description: "Token refreshed successfully",
      },
    },
  });

  const logoutRoute = createRoute({
    method: "post",
    path: "/logout",
    tags: ["Auth"],
    description: "Logout and invalidate refresh token",
    request: {
      body: { content: { "application/json": { schema: logoutSchema } } },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({ success: z.literal(true) }),
          },
        },
        description: "Logged out successfully",
      },
    },
  });

  const meRoute = createRoute({
    method: "get",
    path: "/me",
    tags: ["Auth"],
    description: "Get current authenticated user",
    middleware: [authMiddleware],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({ user: userResponseSchema }),
          },
        },
        description: "Current user",
      },
    },
  });

  router.openapi(registerRoute, async (c) => {
    const input = c.req.valid("json");
    const user = await register.execute(input);
    return c.json({ user }, 201);
  });

  router.openapi(loginRoute, async (c) => {
    const input = c.req.valid("json");
    const result = await login.execute(input);
    return c.json(result);
  });

  router.openapi(refreshRoute, async (c) => {
    const { refreshToken } = c.req.valid("json");
    const result = await refresh.execute(refreshToken);
    return c.json(result);
  });

  router.openapi(logoutRoute, async (c) => {
    const { refreshToken } = c.req.valid("json");
    await logout.execute(refreshToken);
    return c.json({ success: true as const });
  });

  router.openapi(meRoute, async (c) => {
    const userId = c.get("userId");
    const user = await me.execute(userId);
    return c.json({ user });
  });

  return router;
}
