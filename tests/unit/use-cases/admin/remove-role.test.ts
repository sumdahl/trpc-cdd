// @.rules
import { beforeEach, describe, expect, it } from "bun:test";
import { AppError } from "../../../../src/server/core/errors";
import { RemoveRoleUseCase } from "../../../../src/server/core/use-cases/admin/remove-role";
import { InMemoryRoleRepository } from "../../../mocks/role.in-memory.repository";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";

let userRepository: InMemoryUserRepository;
let roleRepository: InMemoryRoleRepository;
let useCase: RemoveRoleUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  roleRepository = new InMemoryRoleRepository();
  useCase = new RemoveRoleUseCase(userRepository, roleRepository);
});

describe("RemoveRoleUseCase", () => {
  it("removes a role from a user successfully", async () => {
    const user = await userRepository.create({
      email: "alice@example.com",
      name: "Alice",
      passwordHash: "hash",
    });
    const modRole = await roleRepository.findByName("moderator");
    await roleRepository.assignRoleToUser(user.id, modRole!.id);

    // Give admin role to another user so we're not removing last admin
    await useCase.execute(user.id, "moderator", "requesting-user-id");

    const roles = await roleRepository.findRolesByUserId(user.id);
    expect(roles.some((r) => r.name === "moderator")).toBe(false);
  });

  it("throws USER_NOT_FOUND when user does not exist", async () => {
    await useCase
      .execute("non-existent-id", "admin", "requester-id")
      .catch((err: AppError) => {
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
      .execute(user.id, "non-existent-role", "requester-id")
      .catch((err: AppError) => {
        expect(err.code).toBe("ROLE_NOT_FOUND");
        expect(err.statusCode).toBe(404);
      });
  });

  it("throws LAST_ADMIN when removing admin role from the only admin", async () => {
    const user = await userRepository.create({
      email: "alice@example.com",
      name: "Alice",
      passwordHash: "hash",
    });
    const adminRole = await roleRepository.findByName("admin");
    await roleRepository.assignRoleToUser(user.id, adminRole!.id);

    // Only 1 admin — should be blocked
    await useCase
      .execute(user.id, "admin", "requester-id")
      .catch((err: AppError) => {
        expect(err.code).toBe("LAST_ADMIN");
        expect(err.statusCode).toBe(409);
      });
  });

  it("allows removing admin role when multiple admins exist", async () => {
    const user1 = await userRepository.create({
      email: "admin1@example.com",
      name: "Admin1",
      passwordHash: "hash",
    });
    const user2 = await userRepository.create({
      email: "admin2@example.com",
      name: "Admin2",
      passwordHash: "hash",
    });
    const adminRole = await roleRepository.findByName("admin");
    await roleRepository.assignRoleToUser(user1.id, adminRole!.id);
    await roleRepository.assignRoleToUser(user2.id, adminRole!.id);

    // 2 admins — removing one should succeed
    await useCase.execute(user1.id, "admin", "requester-id");

    const roles = await roleRepository.findRolesByUserId(user1.id);
    expect(roles.some((r) => r.name === "admin")).toBe(false);
  });
});
