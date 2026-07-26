import type { FastifyInstance } from "fastify";

export async function registerOpenApi(app: FastifyInstance): Promise<void> {
  await app.register(import("@fastify/swagger"), {
    openapi: {
      info: {
        title: "Malla Interactiva UDD API",
        description:
          "Curriculum catalog, prerequisite eligibility, and credit progress for UDD careers.",
        version: "0.1.0",
      },
      tags: [
        { name: "health", description: "Service health" },
        { name: "careers", description: "Career curriculum and progress" },
        { name: "validation", description: "Curriculum validation" },
      ],
    },
  });

  await app.register(import("@fastify/swagger-ui"), {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
}
