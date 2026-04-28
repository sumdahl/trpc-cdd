import { IRateLimiterService } from "../../core/services/rate-limiter.service";

type Entry = {
  count: number;
  expiresAt: number;
};

export class InMemoryRateLimiterService implements IRateLimiterService {
  private store = new Map<string, Entry>();

  async isAllowed(
    key: string,
    maxAttempts: number,
    windowMs: number,
  ): Promise<boolean> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.expiresAt < now) {
      this.store.set(key, { count: 1, expiresAt: now + windowMs });
      return true;
    }

    if (entry.count >= maxAttempts) {
      return false;
    }

    entry.count++;
    return true;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}
