import { ITodoRepository } from "../../repositories/todo.repository";

export class GetAllTodosUseCase {
  constructor(private readonly repository: ITodoRepository) {}

  async execute() {
    return this.repository.findAll();
  }
}
