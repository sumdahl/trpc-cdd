import { describe, it, expect, mock, beforeEach } from "bun:test";
import { LoginUseCase } from "../../../../src/server/core/use-cases/auth/login";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";
import { InMemoryTokenRepository } from "../../../mocks/token.in-memory.repository";
import { AppError, ErrorCode } from "../../../../src/server/core/errors";
import bcrypt from "bcryptjs";

const passwordHash = await bcrypt.hash("password123", 12);

let userRepository: InMemoryUserRepository;
let tokenRepository: InMemoryTokenRepository;
let useCase: LoginUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  tokenRepository = new InMemoryTokenRepository();
  useCase = new LoginUseCase(userRepository, tokenRepository);
});

describe("LoginUseCase", () => {
  it("should return tokens on valid credentials for verified user", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash,
    });
    await userRepository.markAsVerified(user.id);

    const result = await useCase.execute({
      email: "sumiran@example.com",
      password: "password123",
    });

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result.user.email).toBe("sumiran@example.com");
  });

  it("should throw EMAIL_NOT_VERIFIED for unverified user", async () => {
    await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash,
    });

    const promise = useCase.execute({
      email: "sumiran@example.com",
      password: "password123",
    });

    expect(promise).rejects.toThrow(AppError);
  });

  it("should throw INVALID_CREDENTIALS on wrong password", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash,
    });
    await userRepository.markAsVerified(user.id);

    expect(
      useCase.execute({
        email: "sumiran@example.com",
        password: "wrongpassword",
      }),
    ).rejects.toThrow(AppError);
  });

  it("should throw INVALID_CREDENTIALS if user not found", async () => {
    expect(
      useCase.execute({ email: "noone@example.com", password: "password123" }),
    ).rejects.toThrow(AppError);
  });
});
