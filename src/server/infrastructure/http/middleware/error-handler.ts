import { Context } from "hono";

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export const formatError = (
  code: string,
  message: string,
  details?: unknown,
): ApiErrorResponse => ({
  success: false,
  error: { code, message, details },
});

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: 400 | 404 | 422 | 500 = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (err: Error, c: Context) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message);

  if (err instanceof AppError) {
    return c.json(formatError(err.code, err.message), err.statusCode);
  }

  if (err.name === "ZodError") {
    try {
      const issues = JSON.parse(err.message);
      return c.json(
        formatError(
          "VALIDATION_ERROR",
          "Invalid request data",
          issues.map((i: { path: string[]; message: string }) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        ),
        422,
      );
    } catch {
      return c.json(
        formatError("VALIDATION_ERROR", "Invalid request data"),
        422,
      );
    }
  }

  return c.json(
    formatError("INTERNAL_SERVER_ERROR", "Something went wrong"),
    500,
  );
};
