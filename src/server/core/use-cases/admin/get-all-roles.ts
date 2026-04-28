import { IRoleRepository } from "../../repositories/role.repository";
import { PaginationQuery, paginate, getOffset } from "../../shared/pagination";

export class GetAllRolesUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute({ page, limit }: PaginationQuery) {
    const offset = getOffset(page, limit);
    const { roles, total } = await this.roleRepository.findAll({
      limit,
      offset,
    });

    const data = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: r.createdAt,
    }));

    return paginate(data, total, page, limit);
  }
}
