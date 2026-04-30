// @.rules
import { beforeEach, describe, expect, it } from "bun:test";
import { GetAllUsersUseCase } from "../../../../src/server/core/use-cases/admin/get-all-users";
import { InMemoryRoleRepository } from "../../../mocks/role.in-memory.repository";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";

let userRepository: InMemoryUserRepository;
let roleRepository: InMemoryRoleRepository;
let useCase: GetAllUsersUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  roleRepository = new InMemoryRoleRepository();
  useCase = new GetAllUsersUseCase(userRepository, roleRepository);
});

describe("GetAllUsersUseCase", () => {
  it("returns empty paginated result when no users exist", async () => {
    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(result.meta.page).toBe(1);
    expect(result.meta.totalPages).toBe(0);
    expect(result.meta.hasNext).toBe(false);
    expect(result.meta.hasPrev).toBe(false);
  });

  it("returns paginated users with their roles attached", async () => {
    const user = await userRepository.create({
      email: "alice@example.com",
      name: "Alice",
      passwordHash: "hash",
    });

    const adminRole = await roleRepository.findByName("admin");
    await roleRepository.assignRoleToUser(user.id, adminRole!.id);

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].email).toBe("alice@example.com");
    expect(result.data[0].roles).toContain("admin");
    expect(result.meta.total).toBe(1);
  });

  it("returns empty roles array for users with no roles assigned", async () => {
    await userRepository.create({
      email: "bob@example.com",
      name: "Bob",
      passwordHash: "hash",
    });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.data[0].roles).toEqual([]);
  });

  it("returns correct user shape", async () => {
    const user = await userRepository.create({
      email: "carol@example.com",
      name: "Carol",
      passwordHash: "hash",
    });

    const result = await useCase.execute({ page: 1, limit: 20 });
    const returned = result.data[0];

    expect(returned.id).toBe(user.id);
    expect(returned.email).toBe("carol@example.com");
    expect(returned.name).toBe("Carol");
    expect(returned).toHaveProperty("isVerified");
    expect(returned).toHaveProperty("createdAt");
    expect(returned).not.toHaveProperty("passwordHash");
  });

  it("respects pagination parameters", async () => {
    for (let i = 0; i < 5; i++) {
      await userRepository.create({
        email: `user${i}@example.com`,
        name: `User ${i}`,
        passwordHash: "hash",
      });
    }

    const page1 = await useCase.execute({ page: 1, limit: 2 });
    const page2 = await useCase.execute({ page: 2, limit: 2 });

    expect(page1.data).toHaveLength(2);
    expect(page1.meta.total).toBe(5);
    expect(page1.meta.totalPages).toBe(3);
    expect(page1.meta.hasNext).toBe(true);
    expect(page1.meta.hasPrev).toBe(false);

    expect(page2.data).toHaveLength(2);
    expect(page2.meta.hasNext).toBe(true);
    expect(page2.meta.hasPrev).toBe(true);
  });
});
