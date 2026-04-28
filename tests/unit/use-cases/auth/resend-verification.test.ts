import { describe, it, expect, beforeEach } from "bun:test";
import { ResendVerificationUseCase } from "../../../../src/server/core/use-cases/auth/resend-verification";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";
import { InMemoryVerificationTokenRepository } from "../../../mocks/verification-token.in-memory.repository";
import { MockEmailService } from "../../../mocks/email.service.mock";
import { MockRateLimiterService } from "../../../mocks/rate-limiter.service.mock";
import { AppError } from "../../../../src/server/core/errors";

let userRepository: InMemoryUserRepository;
let verificationTokenRepository: InMemoryVerificationTokenRepository;
let emailService: MockEmailService;
let rateLimiterService: MockRateLimiterService;
let useCase: ResendVerificationUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  verificationTokenRepository = new InMemoryVerificationTokenRepository();
  emailService = new MockEmailService();
  rateLimiterService = new MockRateLimiterService();
  useCase = new ResendVerificationUseCase(
    userRepository,
    verificationTokenRepository,
    emailService,
    rateLimiterService,
  );
});

describe("ResendVerificationUseCase", () => {
  it("should resend verification email for unverified user", async () => {
    await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash: "hash",
    });

    await useCase.execute("sumiran@example.com");

    const email = emailService.getLastVerificationEmail();
    expect(email).not.toBeNull();
    expect(email?.to).toBe("sumiran@example.com");
  });

  it("should throw USER_NOT_FOUND if email does not exist", async () => {
    expect(useCase.execute("noone@example.com")).rejects.toThrow(AppError);
  });

  it("should throw EMAIL_ALREADY_VERIFIED if user is already verified", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash: "hash",
    });
    await userRepository.markAsVerified(user.id);

    expect(useCase.execute("sumiran@example.com")).rejects.toThrow(AppError);
  });

  it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
    rateLimiterService.block();
    await expect(useCase.execute("sumiran@example.com")).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });
});
