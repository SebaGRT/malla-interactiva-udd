import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { loadCareers } from "./services/curriculum-loader.js";
import { registerCareerRoutes } from "./routes/careers.js";
import { registerValidationRoutes } from "./routes/validate.js";
import { registerOpenApi } from "./plugins/openapi.js";
import { healthResponseSchema } from "./schemas/openapi.js";

export async function buildApp() {
  const app = Fastify({
    logger: !config.isVercel,
  });

  await app.register(cors, {
    origin: true,
  });

  if (!config.isVercel) {
    await registerOpenApi(app);
  }

  app.get(
    "/health",
    {
      schema: {
        tags: ["health"],
        summary: "Comprobar el estado del servicio",
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async () => ({
      status: "ok",
      service: "malla-interactiva-udd",
      timestamp: new Date().toISOString(),
    }),
  );

  await loadCareers();
  await registerCareerRoutes(app);
  await registerValidationRoutes(app);

  return app;
}

export async function startServer() {
  const app = await buildApp();

  await app.listen({
    host: config.host,
    port: config.port,
  });

  return app;
}
