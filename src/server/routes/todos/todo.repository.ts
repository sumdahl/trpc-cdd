import { Todo } from "./models";

const TODOS: Todo[] = [
  {
    id: "1",
    title: "Buy groceries",
    description: "Milk, Bread and Egg",
    isCompleted: false,
  },
];

export const todoRepository = {
  findAll: (): Todo[] => {
    return TODOS;
  },

  create: (data: { title: string; description: string }): Todo => {
    const newTodo: Todo = {
      id: (TODOS.length + 1).toString(),
      title: data.title,
      description: data.description,
      isCompleted: false,
    };
    TODOS.push(newTodo);
    return newTodo;
  },
};
