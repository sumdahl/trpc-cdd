import { IRateLimiterService } from "../../src/server/core/services/rate-limiter.service";

export class MockRateLimiterService implements IRateLimiterService {
  private blocked = false;

  async isAllowed(): Promise<boolean> {
    return !this.blocked;
  }

  async reset(): Promise<void> {}

  // test helper — simulate rate limit hit
  block() {
    this.blocked = true;
  }

  unblock() {
    this.blocked = false;
  }
}
