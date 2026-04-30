// @.rules
import { beforeEach, describe, expect, it } from "bun:test";
import { GetAllRolesUseCase } from "../../../../src/server/core/use-cases/admin/get-all-roles";
import { InMemoryRoleRepository } from "../../../mocks/role.in-memory.repository";

let roleRepository: InMemoryRoleRepository;
let useCase: GetAllRolesUseCase;

beforeEach(() => {
  roleRepository = new InMemoryRoleRepository();
  useCase = new GetAllRolesUseCase(roleRepository);
});

describe("GetAllRolesUseCase", () => {
  // InMemoryRoleRepository pre-seeds: user, admin, moderator
  it("returns all roles with correct shape", async () => {
    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.data.length).toBeGreaterThan(0);
    const role = result.data[0];
    expect(role).toHaveProperty("id");
    expect(role).toHaveProperty("name");
    expect(role).toHaveProperty("description");
    expect(role).toHaveProperty("createdAt");
  });

  it("returns correct pagination meta", async () => {
    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
    expect(result.meta.total).toBe(3); // user, admin, moderator
    expect(result.meta.totalPages).toBe(1);
    expect(result.meta.hasNext).toBe(false);
    expect(result.meta.hasPrev).toBe(false);
  });

  it("respects pagination limit", async () => {
    const result = await useCase.execute({ page: 1, limit: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(3);
    expect(result.meta.totalPages).toBe(2);
    expect(result.meta.hasNext).toBe(true);
  });

  it("returns second page correctly", async () => {
    const result = await useCase.execute({ page: 2, limit: 2 });

    expect(result.data).toHaveLength(1);
    expect(result.meta.hasPrev).toBe(true);
    expect(result.meta.hasNext).toBe(false);
  });
});
