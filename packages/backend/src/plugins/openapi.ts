import type { FastifyInstance } from "fastify";

export async function registerOpenApi(app: FastifyInstance): Promise<void> {
  await app.register(import("@fastify/swagger"), {
    openapi: {
      info: {
        title: "API de Malla Interactiva UDD",
        description:
          "Catálogo curricular, cumplimiento de prerrequisitos y avance de créditos de las carreras de la UDD.",
        version: "0.1.0",
      },
      tags: [
        { name: "health", description: "Estado del servicio" },
        { name: "careers", description: "Mallas y avance curricular" },
        { name: "validation", description: "Validación curricular" },
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
