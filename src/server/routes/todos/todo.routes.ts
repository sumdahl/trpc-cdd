import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { getAllTodosResponseModel, todoModel, Todo } from "./models";

const TODOS: Todo[] = [
  {
    id: "1",
    title: "Buy groceries",
    description: "Milk, Bread and Egg",
    isCompleted: false,
  },
];

export const todoRouter = new OpenAPIHono();

const getAllTodosRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Todo"],
  description: "Returns a list of all todos",
  responses: {
    200: {
      content: { "application/json": { schema: getAllTodosResponseModel } },
      description: "List of all todos",
    },
  },
});

const createTodoRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Todo"],
  description: "Creates a new todo",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string(),
            description: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: z.object({ todo: todoModel }) },
      },
      description: "Created todo",
    },
  },
});

todoRouter.openapi(getAllTodosRoute, (c) => {
  return c.json({ todos: TODOS });
});

todoRouter.openapi(createTodoRoute, (c) => {
  const { title, description } = c.req.valid("json");
  const newTodo: Todo = {
    id: (TODOS.length + 1).toString(),
    title,
    description,
    isCompleted: false,
  };
  TODOS.push(newTodo);
  return c.json({ todo: newTodo }, 201);
});
