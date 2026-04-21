import { OpenAPIHono } from "@hono/zod-openapi";
import { todoRouter } from "./routes/todos/todo.routes";

export const appRouter = new OpenAPIHono();

appRouter.route("/todos", todoRouter);
