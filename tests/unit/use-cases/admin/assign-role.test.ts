// @.rules
import { beforeEach, describe, expect, it } from "bun:test";
import { AppError } from "../../../../src/server/core/errors";
import { AssignRoleUseCase } from "../../../../src/server/core/use-cases/admin/assign-role";
import { InMemoryRoleRepository } from "../../../mocks/role.in-memory.repository";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";

let userRepository: InMemoryUserRepository;
let roleRepository: InMemoryRoleRepository;
let useCase: AssignRoleUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  roleRepository = new InMemoryRoleRepository();
  useCase = new AssignRoleUseCase(userRepository, roleRepository);
});

describe("AssignRoleUseCase", () => {
  it("assigns a role to a user successfully", async () => {
    const user = await userRepository.create({
      email: "alice@example.com",
      name: "Alice",
      passwordHash: "hash",
    });

    await useCase.execute(user.id, "admin");

    const roles = await roleRepository.findRolesByUserId(user.id);
    expect(roles.some((r) => r.name === "admin")).toBe(true);
  });

  it("assigning the same role twice does not duplicate it", async () => {
    const user = await userRepository.create({
      email: "alice@example.com",
      name: "Alice",
      passwordHash: "hash",
    });

    await useCase.execute(user.id, "admin");
    await useCase.execute(user.id, "admin");

    const roles = await roleRepository.findRolesByUserId(user.id);
    const adminRoles = roles.filter((r) => r.name === "admin");
    expect(adminRoles).toHaveLength(1);
  });

  it("throws USER_NOT_FOUND when user does not exist", async () => {
    await useCase.execute("non-existent-id", "admin").catch((err: AppError) => {
      expect(err.code).toBe("USER_NOT_FOUND");
      expect(err.statusCode).toBe(404);
    });
  });

  it("throws ROLE_NOT_FOUND when role does not exist", async () => {
    const user = await userRepository.create({
      email: "alice@example.com",
      name: "Alice",
      passwordHash: "hash",
    });

    await useCase
      .execute(user.id, "non-existent-role")
      .catch((err: AppError) => {
        expect(err.code).toBe("ROLE_NOT_FOUND");
        expect(err.statusCode).toBe(404);
      });
  });
});
