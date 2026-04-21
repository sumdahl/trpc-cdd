import { swaggerUI } from "@hono/swagger-ui";
import { appRouter } from "./server";

const PORT = 8000;

const openApiDoc = appRouter.getOpenAPIDocument({
  openapi: "3.0.0",
  info: {
    title: "Contract-Driven API Development with Hono and OpenAPI",
    version: "1.0.0",
  },
  servers: [
    {
      url: "http://localhost:8000",
      description: "dev-server",
    },
  ],
});

await Bun.write("./openapi-specs.json", JSON.stringify(openApiDoc, null, 2));

appRouter.get("/openapi.json", (c) => c.json(openApiDoc));
appRouter.get("/docs", swaggerUI({ url: "/openapi.json" }));

export default {
  port: PORT,
  fetch: appRouter.fetch,
};
