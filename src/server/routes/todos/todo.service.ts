import { todoRepository } from "./todo.repository";
import { Todo } from "./models";

export const todoService = {
  getAllTodos: (): Todo[] => {
    return todoRepository.findAll();
  },

  createTodo: (data: { title: string; description: string }): Todo => {
    return todoRepository.create(data);
  },
};
