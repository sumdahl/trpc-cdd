// @.rules
import { Context } from "hono";

export type AppContext = {
  Variables: {
    requestId: string;
    userId?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    jti?: string;
    exp?: number;
  };
};

export type AppEnv = Context<AppContext>;
