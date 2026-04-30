import { Redis } from "ioredis";
import { ITokenBlacklistService } from "../../core/services/token-blacklist.service";
import { logger } from "../logger";

export class RedisTokenBlacklistService implements ITokenBlacklistService {
  constructor(private readonly redis: Redis) {}

  async blacklist(jti: string, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(`blacklist:${jti}`, "1", "EX", ttlSeconds);
    } catch (err) {
      logger.error({ err }, "[Redis] Failed to blacklist token");
    }
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    try {
      const result = await this.redis.get(`blacklist:${jti}`);
      return result !== null;
    } catch (err) {
      logger.error({ err }, "[Redis] Failed to check blacklist");
      return false; // fail open — don't block users if Redis is down
    }
  }
}
