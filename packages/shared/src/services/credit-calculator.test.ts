import { describe, expect, it } from "vitest";
import { calculateCategoryCourseProgress } from "./credit-calculator.js";

describe("calculateCategoryCourseProgress", () => {
  it("returns integer course completion percent per category", () => {
    const categories = {
      IIA: { color: "#000", label: "Core" },
      GIC: { color: "#111", label: "Gestion" },
    };

    const curriculum = {
      meta: {
        university: "UDD",
        career: "Test",
        code: "TST",
        version: "1",
        totalCreditsRequired: 30,
      },
      requirements: [],
      periods: [
        {
          id: "s1",
          type: "semester" as const,
          semester: 1,
          label: "S1",
          order: 1,
          courses: [
            {
              code: "A",
              name: "A",
              credits: 5,
              category: "IIA",
              prerequisites: [],
              offering: "A" as const,
            },
            {
              code: "B",
              name: "B",
              credits: 5,
              category: "IIA",
              prerequisites: [],
              offering: "A" as const,
            },
            {
              code: "C",
              name: "C",
              credits: 5,
              category: "GIC",
              prerequisites: [],
              offering: "A" as const,
            },
          ],
        },
      ],
    };

    const progress = calculateCategoryCourseProgress(curriculum, categories, ["A"]);

    expect(progress).toEqual([
      {
        categoryCode: "IIA",
        label: "Core",
        color: "#000",
        approvedCount: 1,
        totalCount: 2,
        progressPercent: 50,
      },
      {
        categoryCode: "GIC",
        label: "Gestion",
        color: "#111",
        approvedCount: 0,
        totalCount: 1,
        progressPercent: 0,
      },
    ]);
  });
});
