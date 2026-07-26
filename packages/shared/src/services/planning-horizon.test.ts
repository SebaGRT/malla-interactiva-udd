import { describe, expect, it } from "vitest";
import type { Curriculum } from "../schemas/curriculum.js";
import {
  applyPlanningHorizon,
  canInteractWithCourse,
  getMaxAllowedSemester,
  getPeriodSelectionState,
  getPlanningAnchorSemester,
  togglePeriodApprovals,
} from "./planning-horizon.js";
import { evaluateEligibility } from "./credit-calculator.js";

function makeCurriculum(periods: Curriculum["periods"]): Curriculum {
  return {
    meta: {
      university: "UDD",
      career: "Test",
      code: "TST",
      version: "1",
      totalCreditsRequired: 100,
    },
    requirements: [],
    periods,
  };
}

describe("planning horizon", () => {
  const curriculum = makeCurriculum([
    {
      id: "s1",
      type: "semester",
      semester: 1,
      label: "Semestre I",
      order: 1,
      courses: [
        {
          code: "A",
          name: "A",
          credits: 5,
          category: "IIA",
          prerequisites: [],
          offering: "A",
        },
        {
          code: "B",
          name: "B",
          credits: 5,
          category: "IIA",
          prerequisites: ["A"],
          offering: "A",
        },
      ],
    },
    {
      id: "s3",
      type: "semester",
      semester: 3,
      label: "Semestre III",
      order: 3,
      courses: [
        {
          code: "C",
          name: "C",
          credits: 5,
          category: "IIA",
          prerequisites: [],
          offering: "A",
        },
      ],
    },
    {
      id: "s4",
      type: "semester",
      semester: 4,
      label: "Semestre IV",
      order: 4,
      courses: [
        {
          code: "D",
          name: "D",
          credits: 5,
          category: "IIA",
          prerequisites: [],
          offering: "A",
        },
      ],
    },
    {
      id: "s6",
      type: "semester",
      semester: 6,
      label: "Semestre VI",
      order: 6,
      courses: [
        {
          code: "F",
          name: "F",
          credits: 5,
          category: "IIA",
          prerequisites: [],
          offering: "A",
        },
      ],
    },
  ]);

  it("defaults anchor to semester 1 with no approvals", () => {
    expect(getPlanningAnchorSemester(curriculum, [])).toBe(1);
    expect(getMaxAllowedSemester(1)).toBe(4);
  });

  it("allows through semester IV when anchor is semester I", () => {
    const eligibility = applyPlanningHorizon(
      evaluateEligibility(curriculum, []),
      curriculum,
      [],
    );

    expect(eligibility.find((e) => e.code === "A")?.status).toBe("available");
    expect(eligibility.find((e) => e.code === "D")?.status).toBe("available");
    expect(eligibility.find((e) => e.code === "F")?.status).toBe(
      "beyond_horizon",
    );
  });

  it("blocks interaction when prerequisites are not approved", () => {
    const approved = new Set<string>();

    expect(canInteractWithCourse(curriculum, "A", approved)).toBe(true);
    expect(canInteractWithCourse(curriculum, "B", approved)).toBe(false);

    approved.add("A");
    expect(canInteractWithCourse(curriculum, "B", approved)).toBe(true);
  });

  it("extends horizon when anchor advances to semester III", () => {
    const eligibility = applyPlanningHorizon(
      evaluateEligibility(curriculum, ["C"]),
      curriculum,
      ["C"],
    );

    expect(eligibility.find((e) => e.code === "D")?.status).toBe("available");
    expect(eligibility.find((e) => e.code === "F")?.status).toBe("available");
  });

  it("selects all eligible courses in a period respecting prerequisites", () => {
    const next = togglePeriodApprovals(curriculum, "s1", new Set());

    expect(next.has("A")).toBe(true);
    expect(next.has("B")).toBe(true);
    expect(getPeriodSelectionState(curriculum.periods[0]!, next)).toBe("all");
  });

  it("clears all courses in a period when all are approved", () => {
    const next = togglePeriodApprovals(
      curriculum,
      "s1",
      new Set(["A", "B"]),
    );

    expect(next.size).toBe(0);
  });
});
