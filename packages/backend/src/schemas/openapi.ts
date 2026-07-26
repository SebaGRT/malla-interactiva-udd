export const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    code: { type: "string" },
  },
  required: ["error"],
} as const;

export const approvedBodySchema = {
  type: "object",
  properties: {
    approved: {
      type: "array",
      items: { type: "string" },
      description: "Course codes marked as approved/passed",
    },
  },
} as const;

export const healthResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    service: { type: "string" },
    timestamp: { type: "string", format: "date-time" },
  },
} as const;

export const careersListResponseSchema = {
  type: "object",
  properties: {
    careers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          name: { type: "string" },
          university: { type: "string" },
          version: { type: "string" },
          totalCreditsRequired: { type: "integer" },
          periodCount: { type: "integer" },
          semesterPeriodCount: { type: "integer" },
          trimesterPeriodCount: { type: "integer" },
          courseCount: { type: "integer" },
        },
      },
    },
  },
} as const;

export const careerCodeParamsSchema = {
  type: "object",
  properties: {
    code: { type: "string", description: "Career code, e.g. IIT" },
  },
  required: ["code"],
} as const;
