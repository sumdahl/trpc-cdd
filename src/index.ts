import "./server/config/env";
import { swaggerUI } from "@hono/swagger-ui";
import { appRouter } from "./server";
import { env } from "./server/config/env";

const openApiDoc = appRouter.getOpenAPIDocument({
  openapi: "3.0.0",
  info: {
    title: "Contract-Driven API Development with Hono and OpenAPI",
    version: "1.0.0",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: "Local development server",
    },
  ],
});

await Bun.write("./openapi-specs.json", JSON.stringify(openApiDoc, null, 2));

appRouter.get("/openapi.json", (c) => c.json(openApiDoc));
appRouter.get("/docs", swaggerUI({ url: "/openapi.json" }));

export default {
  port: env.PORT,
  fetch: appRouter.fetch,
};
