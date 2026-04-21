import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { getAllTodosResponseModel, todoModel } from "./models";
import { todoService } from "./todo.service";

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
  const todos = todoService.getAllTodos();
  return c.json({ todos });
});

todoRouter.openapi(createTodoRoute, (c) => {
  const input = c.req.valid("json");
  const todo = todoService.createTodo(input);
  return c.json({ todo }, 201);
});
