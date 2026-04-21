import { db } from "../../db";
import { PostgresUserRepository } from "../../persistence/user.pg.repository";
import { RegisterUseCase } from "../../../core/use-cases/auth/register";
import { LoginUseCase } from "../../../core/use-cases/auth/login";
import { RefreshUseCase } from "../../../core/use-cases/auth/refresh";
import { LogoutUseCase } from "../../../core/use-cases/auth/logout";
import { MeUseCase } from "../../../core/use-cases/auth/me";
import { createAuthRouter } from "./auth.routes";

const repository = new PostgresUserRepository(db);
const register = new RegisterUseCase(repository);
const login = new LoginUseCase(repository);
const refresh = new RefreshUseCase(repository);
const logout = new LogoutUseCase(repository);
const me = new MeUseCase(repository);

export const authRouter = createAuthRouter(
  register,
  login,
  refresh,
  logout,
  me,
);
