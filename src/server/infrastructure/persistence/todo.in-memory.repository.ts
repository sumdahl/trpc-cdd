import { ITodoRepository } from "../../core/repositories/todo.repository";
import { TodoEntity } from "../../core/entities/todo.entity";

const TODOS: TodoEntity[] = [
  new TodoEntity("1", "Buy groceries", "Milk, Bread and Egg", false),
];

export class InMemoryTodoRepository implements ITodoRepository {
  async findAll(): Promise<TodoEntity[]> {
    return TODOS;
  }

  async create(data: {
    title: string;
    description: string;
  }): Promise<TodoEntity> {
    const todo = new TodoEntity(
      (TODOS.length + 1).toString(),
      data.title,
      data.description,
      false,
    );
    TODOS.push(todo);
    return todo;
  }
}
