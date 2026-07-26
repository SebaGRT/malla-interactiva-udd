import { describe, expect, it } from "vitest";
import {
  arePrerequisitesMet,
  evaluateEligibility,
  getUnmetPrerequisiteGroups,
} from "../index.js";
import type { Curriculum } from "../schemas/curriculum.js";

const sampleCurriculum: Curriculum = {
  meta: {
    university: "Test",
    career: "Test",
    code: "TST",
    version: "1",
    totalCreditsRequired: 10,
    scheduling: {
      semesterPeriodsThrough: 4,
      trimesterFromSemester: 5,
    },
  },
  requirements: [],
  periods: [
    {
      id: "s1",
      type: "semester",
      semester: 1,
      label: "Semestre I",
      order: 1,
      courses: [
        {
          code: "A",
          name: "Course A",
          credits: 3,
          category: "CBE",
          prerequisites: [],
          offering: "A",
        },
      ],
    },
    {
      id: "t13",
      type: "trimester",
      semester: 5,
      trimesterInSemester: 1,
      trimester: 13,
      label: "Trimestre 13",
      order: 13,
      courses: [
        {
          code: "B",
          name: "Course B",
          credits: 3,
          category: "CBE",
          prerequisites: ["A"],
          offering: "A",
        },
        {
          code: "C",
          name: "Course C",
          credits: 3,
          category: "CBE",
          prerequisites: [["A", "B"]],
          offering: "A",
        },
      ],
    },
  ],
};

describe("prerequisite engine", () => {
  it("treats top-level prerequisites as AND", () => {
    expect(arePrerequisitesMet(["A", "B"], new Set(["A", "B"]))).toBe(true);
    expect(arePrerequisitesMet(["A", "B"], new Set(["A"]))).toBe(false);
  });

  it("treats nested arrays as OR groups", () => {
    expect(arePrerequisitesMet([["A", "B"]], new Set(["B"]))).toBe(true);
    expect(arePrerequisitesMet([["A", "B"]], new Set(["C"]))).toBe(false);
  });

  it("returns unmet OR groups", () => {
    expect(getUnmetPrerequisiteGroups([["A", "B"]], new Set(["C"]))).toEqual([
      ["A", "B"],
    ]);
  });
});

describe("eligibility", () => {
  it("marks courses as available or blocked", () => {
    const result = evaluateEligibility(sampleCurriculum, ["A"]);
    const courseB = result.find((item) => item.code === "B");
    const courseC = result.find((item) => item.code === "C");

    expect(courseB?.status).toBe("available");
    expect(courseC?.status).toBe("available");
  });
});
