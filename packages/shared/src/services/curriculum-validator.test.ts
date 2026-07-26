import { describe, expect, it } from "vitest";
import type { Curriculum } from "../schemas/curriculum.js";
import { validateCurriculum } from "./curriculum-validator.js";

const baseMeta = {
  university: "Test",
  career: "Test",
  code: "TST",
  version: "1",
  totalCreditsRequired: 6,
  extradisciplinaryCredits: 0,
};

function makeCurriculum(periods: Curriculum["periods"]): Curriculum {
  return { meta: baseMeta, requirements: [], periods };
}

describe("validateCurriculum", () => {
  it("passes a simple valid malla", () => {
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
            credits: 3,
            category: "CBE",
            prerequisites: [],
            offering: "A",
          },
          {
            code: "B",
            name: "B",
            credits: 3,
            category: "CBE",
            prerequisites: ["A"],
            offering: "A",
          },
        ],
      },
    ]);

    const report = validateCurriculum(curriculum);
    expect(report.valid).toBe(true);
    expect(report.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("detects missing prerequisites", () => {
    const curriculum = makeCurriculum([
      {
        id: "s1",
        type: "semester",
        semester: 1,
        label: "Semestre I",
        order: 1,
        courses: [
          {
            code: "B",
            name: "B",
            credits: 3,
            category: "CBE",
            prerequisites: ["MISSING"],
            offering: "A",
          },
        ],
      },
    ]);

    const report = validateCurriculum(curriculum);
    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.code === "MISSING_PREREQUISITE")).toBe(
      true,
    );
  });

  it("detects prerequisite cycles", () => {
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
            credits: 3,
            category: "CBE",
            prerequisites: ["B"],
            offering: "A",
          },
          {
            code: "B",
            name: "B",
            credits: 3,
            category: "CBE",
            prerequisites: ["A"],
            offering: "A",
          },
        ],
      },
    ]);

    const report = validateCurriculum(curriculum);
    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.code === "PREREQUISITE_CYCLE")).toBe(
      true,
    );
  });

  it("detects credit total mismatch", () => {
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
            credits: 3,
            category: "CBE",
            prerequisites: [],
            offering: "A",
          },
        ],
      },
    ]);

    const report = validateCurriculum(curriculum);
    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.code === "CREDIT_TOTAL_MISMATCH")).toBe(
      true,
    );
  });
});
