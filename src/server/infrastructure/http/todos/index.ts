import { db } from "../../db";
import { PostgresTodoRepository } from "../../persistence/todo.pg.repository";
import { GetAllTodosUseCase } from "../../../core/use-cases/todos/get-all-todos";
import { CreateTodoUseCase } from "../../../core/use-cases/todos/create-todo";
import { createTodoRouter } from "./todo.routes";

const repository = new PostgresTodoRepository(db);
const getAllTodos = new GetAllTodosUseCase(repository);
const createTodo = new CreateTodoUseCase(repository);

export const todoRouter = createTodoRouter(getAllTodos, createTodo);
