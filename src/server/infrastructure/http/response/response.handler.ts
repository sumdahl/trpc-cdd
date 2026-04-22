import { Context } from "hono";
import { formatSuccess } from "./response.formatter";

type ContentfulStatusCode = 200 | 201 | 202;

export const successHandler = <T, S extends ContentfulStatusCode = 200>(
  c: Context,
  data: T,
  message?: string,
  statusCode?: S,
) => {
  const status = statusCode ?? 200;
  return c.json(formatSuccess(data, message), status);
};
