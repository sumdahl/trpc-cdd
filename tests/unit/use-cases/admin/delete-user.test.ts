// @.rules
import { beforeEach, describe, expect, it } from "bun:test";
import { AppError } from "../../../../src/server/core/errors";
import { DeleteUserUseCase } from "../../../../src/server/core/use-cases/admin/delete-user";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";

let userRepository: InMemoryUserRepository;
let useCase: DeleteUserUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  useCase = new DeleteUserUseCase(userRepository);
});

describe("DeleteUserUseCase", () => {
  it("deletes a user successfully", async () => {
    const admin = await userRepository.create({
      email: "admin@example.com",
      name: "Admin",
      passwordHash: "hash",
    });
    const target = await userRepository.create({
      email: "target@example.com",
      name: "Target",
      passwordHash: "hash",
    });

    await useCase.execute(target.id, admin.id);

    const deleted = await userRepository.findById(target.id);
    expect(deleted).toBeNull();
  });

  it("throws FORBIDDEN when admin tries to delete their own account", async () => {
    const admin = await userRepository.create({
      email: "admin@example.com",
      name: "Admin",
      passwordHash: "hash",
    });

    await useCase.execute(admin.id, admin.id).catch((err: AppError) => {
      expect(err.code).toBe("FORBIDDEN");
      expect(err.statusCode).toBe(403);
    });
  });

  it("does not delete the requesting user's account", async () => {
    const admin = await userRepository.create({
      email: "admin@example.com",
      name: "Admin",
      passwordHash: "hash",
    });

    expect(useCase.execute(admin.id, admin.id)).rejects.toThrow(AppError);

    const stillExists = await userRepository.findById(admin.id);
    expect(stillExists).not.toBeNull();
  });

  it("throws USER_NOT_FOUND when target user does not exist", async () => {
    const admin = await userRepository.create({
      email: "admin@example.com",
      name: "Admin",
      passwordHash: "hash",
    });

    await useCase.execute("non-existent-id", admin.id).catch((err: AppError) => {
      expect(err.code).toBe("USER_NOT_FOUND");
      expect(err.statusCode).toBe(404);
    });
  });
});
