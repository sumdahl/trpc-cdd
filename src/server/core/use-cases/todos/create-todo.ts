import { ITodoRepository } from "../../repositories/todo.repository";

export class CreateTodoUseCase {
  constructor(private readonly repository: ITodoRepository) {}

  async execute(data: { title: string; description: string }) {
    return this.repository.create(data);
  }
}
