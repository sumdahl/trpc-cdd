import { MiddlewareHandler } from "hono";
import { AppContext } from "../types/context";
import { logger } from "../../logger";

export const requestLogger: MiddlewareHandler<AppContext> = async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);

  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  logger.info({ requestId, method, path }, "→ incoming request");

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info(
    { requestId, method, path, status, duration },
    "← outgoing response",
  );

  c.res.headers.set("X-Request-Id", requestId);
};
