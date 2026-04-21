import { OpenAPIHono } from "@hono/zod-openapi";
import { todoRouter } from "./infrastructure/http/todos";
import { requestLogger } from "./infrastructure/http/middleware/logger";
import { errorHandler } from "./infrastructure/http/middleware/error-handler";
import { healthRouter } from "./infrastructure/http/health/health.routes";

export const appRouter = new OpenAPIHono().basePath("/api/v1");

appRouter.use("*", requestLogger);
appRouter.onError(errorHandler);
appRouter.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404,
  );
});

appRouter.route("/todos", todoRouter);
appRouter.route("/health", healthRouter);
