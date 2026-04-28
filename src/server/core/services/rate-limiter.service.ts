export interface IRateLimiterService {
  isAllowed(
    key: string,
    maxAttempts: number,
    windowMs: number,
  ): Promise<boolean>;
  reset(key: string): Promise<void>;
}
