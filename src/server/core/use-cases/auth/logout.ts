import { ITokenRepository } from "../../repositories/token.repository";
import { ITokenBlacklistService } from "../../services/token-blacklist.service";
import { AppError, ErrorCode } from "../../errors";

export class LogoutUseCase {
  constructor(
    private readonly tokenRepository: ITokenRepository,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  async execute(refreshToken: string, jti: string, exp: number) {
    const stored = await this.tokenRepository.find(refreshToken);
    if (!stored) {
      throw new AppError(
        ErrorCode.INVALID_TOKEN,
        "Refresh token not found",
        401,
      );
    }

    await this.tokenRepository.delete(refreshToken);

    const ttl = exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.tokenBlacklistService.blacklist(jti, ttl);
    }
  }
}
