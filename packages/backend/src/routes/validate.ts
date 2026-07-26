import type { FastifyInstance } from "fastify";
import { validateCurriculum } from "@malla-udd/shared";
import { getCareer } from "../services/curriculum-loader.js";
import { careerCodeParamsSchema, errorResponseSchema } from "../schemas/openapi.js";

export async function registerValidationRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get<{ Params: { code: string } }>(
    "/careers/:code/validate",
    {
      schema: {
        tags: ["validation"],
        summary: "Validate curriculum data integrity",
        params: careerCodeParamsSchema,
        response: {
          200: { type: "object", additionalProperties: true },
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const career = getCareer(request.params.code);

      if (!career) {
        return reply.status(404).send({
          error: "Career not found",
          code: request.params.code,
        });
      }

      return validateCurriculum(career.curriculum, {
        categories: career.categories,
      });
    },
  );
}
