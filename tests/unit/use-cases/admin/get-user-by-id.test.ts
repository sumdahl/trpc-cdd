// @.rules
import { beforeEach, describe, expect, it } from "bun:test";
import { AppError } from "../../../../src/server/core/errors";
import { GetUserByIdUseCase } from "../../../../src/server/core/use-cases/admin/get-user-by-id";
import { InMemoryRoleRepository } from "../../../mocks/role.in-memory.repository";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";

let userRepository: InMemoryUserRepository;
let roleRepository: InMemoryRoleRepository;
let useCase: GetUserByIdUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  roleRepository = new InMemoryRoleRepository();
  useCase = new GetUserByIdUseCase(userRepository, roleRepository);
});

describe("GetUserByIdUseCase", () => {
  it("returns user with roles when found", async () => {
    const user = await userRepository.create({
      email: "alice@example.com",
      name: "Alice",
      passwordHash: "hash",
    });
    const adminRole = await roleRepository.findByName("admin");
    await roleRepository.assignRoleToUser(user.id, adminRole!.id);

    const result = await useCase.execute(user.id);

    expect(result.id).toBe(user.id);
    expect(result.email).toBe("alice@example.com");
    expect(result.name).toBe("Alice");
    expect(result.roles).toContain("admin");
    expect(result).toHaveProperty("isVerified");
    expect(result).toHaveProperty("createdAt");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("returns empty roles array for user with no roles", async () => {
    const user = await userRepository.create({
      email: "bob@example.com",
      name: "Bob",
      passwordHash: "hash",
    });

    const result = await useCase.execute(user.id);

    expect(result.roles).toEqual([]);
  });

  it("throws USER_NOT_FOUND when user does not exist", async () => {
    expect(useCase.execute("non-existent-id")).rejects.toThrow(AppError);

    await useCase.execute("non-existent-id").catch((err: AppError) => {
      expect(err.code).toBe("USER_NOT_FOUND");
      expect(err.statusCode).toBe(404);
    });
  });
});
