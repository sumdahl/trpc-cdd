export interface ITokenBlacklistService {
  blacklist(jti: string, ttlSeconds: number): Promise<void>;
  isBlacklisted(jti: string): Promise<boolean>;
}
