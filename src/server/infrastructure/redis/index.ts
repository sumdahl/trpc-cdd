import { Redis } from "ioredis";
import { env } from "../../config/env";
import { logger } from "../logger";

const url = new URL(env.REDIS_URL);

export const redis = new Redis({
  host: url.hostname,
  port: Number(url.port) || 6379,
  lazyConnect: true,
});

redis.on("connect", () => logger.info("[Redis] Connected"));
redis.on("error", (err) => logger.error({ err }, "[Redis] Error"));
