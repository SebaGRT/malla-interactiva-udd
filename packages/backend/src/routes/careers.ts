import type { FastifyInstance } from "fastify";
import {
  calculateCredits,
  evaluateEligibility,
  validateApprovedCodes,
} from "@malla-udd/shared";
import { getCareer, listCareers } from "../services/curriculum-loader.js";
import {
  approvedBodySchema,
  careerCodeParamsSchema,
  careersListResponseSchema,
  errorResponseSchema,
} from "../schemas/openapi.js";

export async function registerCareerRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/careers",
    {
      schema: {
        tags: ["careers"],
        summary: "List available careers",
        response: {
          200: careersListResponseSchema,
        },
      },
    },
    async () => ({
      careers: listCareers(),
    }),
  );

  app.get<{ Params: { code: string } }>(
    "/careers/:code/curriculum",
    {
      schema: {
        tags: ["careers"],
        summary: "Get full curriculum and categories",
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

      return {
        meta: career.curriculum.meta,
        requirements: career.curriculum.requirements,
        periods: career.curriculum.periods,
        categories: career.categories,
      };
    },
  );

  app.post<{
    Params: { code: string };
    Body: { approved?: string[] };
  }>(
    "/careers/:code/eligibility",
    {
      schema: {
        tags: ["careers"],
        summary: "Check which courses are approved, available, or blocked",
        params: careerCodeParamsSchema,
        body: approvedBodySchema,
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

      const approved = request.body?.approved ?? [];
      const { valid, unknown } = validateApprovedCodes(
        career.curriculum,
        approved,
      );

      return {
        approved: valid,
        unknown,
        courses: evaluateEligibility(career.curriculum, valid),
      };
    },
  );

  app.post<{
    Params: { code: string };
    Body: { approved?: string[] };
  }>(
    "/careers/:code/credits",
    {
      schema: {
        tags: ["careers"],
        summary: "Credit progress toward degree total",
        params: careerCodeParamsSchema,
        body: approvedBodySchema,
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

      const approved = request.body?.approved ?? [];
      const { valid, unknown } = validateApprovedCodes(
        career.curriculum,
        approved,
      );

      return {
        approved: valid,
        unknown,
        summary: calculateCredits(
          career.curriculum,
          career.categories,
          valid,
        ),
      };
    },
  );
}
