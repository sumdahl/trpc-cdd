import { IUserRepository } from "../../repositories/user.repository";
import { AppError } from "../../../infrastructure/http/middleware/error-handler";

export class LogoutUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(token: string) {
    const stored = await this.userRepository.findRefreshToken(token);
    if (!stored) {
      throw new AppError("INVALID_TOKEN", "Refresh token not found", 401);
    }
    await this.userRepository.deleteRefreshToken(token);
  }
}
