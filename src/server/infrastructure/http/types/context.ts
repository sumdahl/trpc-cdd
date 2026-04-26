import { Context } from "hono";

export type AppContext = {
  Variables: {
    requestId: string;
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
};

export type AppEnv = Context<AppContext>;
