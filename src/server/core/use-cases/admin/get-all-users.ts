import { IUserRepository } from "../../repositories/user.repository";
import { IRoleRepository } from "../../repositories/role.repository";
import { PaginationQuery, paginate, getOffset } from "../../shared/pagination";

export class GetAllUsersUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute({ page, limit }: PaginationQuery) {
    const offset = getOffset(page, limit);
    const { users, total } = await this.userRepository.findAll({
      limit,
      offset,
    });

    if (users.length === 0) return paginate([], total, page, limit);

    // single query for all users' roles — no N+1
    const userIds = users.map((u) => u.id);
    const rolesMap = await this.roleRepository.findRolesByUserIds(userIds);

    const usersWithRoles = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      roles: (rolesMap.get(user.id) ?? []).map((r) => r.name),
      createdAt: user.createdAt,
    }));

    return paginate(usersWithRoles, total, page, limit);
  }
}
