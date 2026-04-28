import { describe, it, expect, beforeEach } from "bun:test";
import { ForgotPasswordUseCase } from "../../../../src/server/core/use-cases/auth/forgot-password";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";
import { InMemoryPasswordResetTokenRepository } from "../../../mocks/password-reset-token.in-memory.repository";
import { MockEmailService } from "../../../mocks/email.service.mock";
import { MockRateLimiterService } from "../../../mocks/rate-limiter.service.mock";

let userRepository: InMemoryUserRepository;
let passwordResetTokenRepository: InMemoryPasswordResetTokenRepository;
let emailService: MockEmailService;
let rateLimiterService: MockRateLimiterService;
let useCase: ForgotPasswordUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  passwordResetTokenRepository = new InMemoryPasswordResetTokenRepository();
  emailService = new MockEmailService();
  rateLimiterService = new MockRateLimiterService();
  useCase = new ForgotPasswordUseCase(
    userRepository,
    passwordResetTokenRepository,
    emailService,
    rateLimiterService,
  );
});

describe("ForgotPasswordUseCase", () => {
  it("sends reset email for verified user", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash: "hash",
    });
    await userRepository.markAsVerified(user.id);

    await useCase.execute("sumiran@example.com");

    const email = emailService.sentEmails.find(
      (e) => e.type === "passwordReset",
    );
    expect(email).not.toBeNull();
    expect(email?.to).toBe("sumiran@example.com");
  });

  it("returns silently for unknown email — no error, no email", async () => {
    await useCase.execute("noone@example.com");
    expect(emailService.sentEmails.length).toBe(0);
  });

  it("returns silently for unverified user — no error, no email", async () => {
    await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash: "hash",
    });

    await useCase.execute("sumiran@example.com");
    expect(emailService.sentEmails.length).toBe(0);
  });

  it("replaces existing token on second request", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash: "hash",
    });
    await userRepository.markAsVerified(user.id);

    await useCase.execute("sumiran@example.com");
    await useCase.execute("sumiran@example.com");

    const emails = emailService.sentEmails.filter(
      (e) => e.type === "passwordReset",
    );
    expect(emails.length).toBe(2);
    expect(emails[0].token).not.toBe(emails[1].token);
  });

  it("saves token with 1-hour expiry", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash: "hash",
    });
    await userRepository.markAsVerified(user.id);

    const before = Date.now();
    await useCase.execute("sumiran@example.com");
    const after = Date.now();

    const email = emailService.sentEmails.find(
      (e) => e.type === "passwordReset",
    );
    const token = await passwordResetTokenRepository.find(email!.token);
    const oneHour = 60 * 60 * 1000;

    expect(token!.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + oneHour - 100,
    );
    expect(token!.expiresAt.getTime()).toBeLessThanOrEqual(
      after + oneHour + 100,
    );
  });

  it("throws TOO_MANY_REQUESTS when rate limited", async () => {
    rateLimiterService.block();
    await expect(useCase.execute("sumiran@example.com")).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });
});
