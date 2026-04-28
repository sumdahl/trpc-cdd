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

    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roles = await this.roleRepository.findRolesByUserId(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
          roles: roles.map((r) => r.name),
          createdAt: user.createdAt,
        };
      }),
    );

    return paginate(usersWithRoles, total, page, limit);
  }
}
