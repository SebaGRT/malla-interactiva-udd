import type { Categories, Course, Curriculum, Period } from "../schemas/curriculum.js";
import {
  buildCourseIndex,
  getExtradisciplinaryCredits,
  sumGridCredits,
} from "./credit-calculator.js";
import { flattenCourses } from "../utils/curriculum.js";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  courseCode?: string;
  periodId?: string;
}

export interface ValidationStats {
  courseCount: number;
  periodCount: number;
  semesterPeriodCount: number;
  trimesterPeriodCount: number;
  gridCredits: number;
  extradisciplinaryCredits: number;
  extradisciplinaryInGrid: number;
  requiredCredits: number;
}

export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
  stats: ValidationStats;
}

export interface ValidateCurriculumOptions {
  categories?: Categories;
}

function collectPrerequisiteCodes(prerequisites: Course["prerequisites"]): string[] {
  const codes: string[] = [];

  for (const item of prerequisites) {
    if (Array.isArray(item)) {
      codes.push(...item);
    } else {
      codes.push(item);
    }
  }

  return codes;
}

function buildCoursePeriodMap(curriculum: Curriculum): Map<string, Period> {
  const map = new Map<string, Period>();

  for (const period of curriculum.periods) {
    for (const course of period.courses) {
      if (!map.has(course.code)) {
        map.set(course.code, period);
      }
    }
  }

  return map;
}

function findDuplicateCodes(curriculum: Curriculum): string[] {
  const counts = new Map<string, number>();

  for (const course of flattenCourses(curriculum)) {
    counts.set(course.code, (counts.get(course.code) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([code]) => code);
}

function findPrerequisiteCycles(
  courses: Map<string, Course>,
): string[][] {
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  const dfs = (code: string): void => {
    if (visited.has(code)) return;

    if (visiting.has(code)) {
      const start = stack.indexOf(code);
      if (start !== -1) {
        cycles.push([...stack.slice(start), code]);
      }
      return;
    }

    visiting.add(code);
    stack.push(code);

    const course = courses.get(code);
    if (course) {
      for (const prereq of collectPrerequisiteCodes(course.prerequisites)) {
        if (courses.has(prereq)) {
          dfs(prereq);
        }
      }
    }

    stack.pop();
    visiting.delete(code);
    visited.add(code);
  };

  for (const code of courses.keys()) {
    dfs(code);
  }

  return cycles;
}

function periodOrder(period: Period): number {
  return period.order;
}

export function sumExtradisciplinaryCreditsInGrid(
  curriculum: Curriculum,
): number {
  let total = 0;

  for (const course of buildCourseIndex(curriculum).values()) {
    if (course.category === "EEL" && course.credits !== null) {
      total += course.credits;
    }
  }

  return total;
}

export function validateCurriculum(
  curriculum: Curriculum,
  options: ValidateCurriculumOptions = {},
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const { categories } = options;

  const courseIndex = buildCourseIndex(curriculum);
  const courses = [...courseIndex.values()];
  const codeSet = new Set(courses.map((c) => c.code));
  const periodByCourse = buildCoursePeriodMap(curriculum);

  const gridCredits = sumGridCredits(curriculum);
  const extradisciplinaryMeta = getExtradisciplinaryCredits(curriculum);
  const extradisciplinaryInGrid = sumExtradisciplinaryCreditsInGrid(curriculum);
  const required = curriculum.meta.totalCreditsRequired;

  const stats: ValidationStats = {
    courseCount: courses.length,
    periodCount: curriculum.periods.length,
    semesterPeriodCount: curriculum.periods.filter((p) => p.type === "semester")
      .length,
    trimesterPeriodCount: curriculum.periods.filter((p) => p.type === "trimester")
      .length,
    gridCredits,
    extradisciplinaryCredits: extradisciplinaryMeta,
    extradisciplinaryInGrid,
    requiredCredits: required,
  };

  for (const code of findDuplicateCodes(curriculum)) {
    issues.push({
      severity: "error",
      code: "DUPLICATE_CODE",
      message: `Course code "${code}" appears more than once in the grid`,
      courseCode: code,
    });
  }

  if (gridCredits !== required) {
    issues.push({
      severity: "error",
      code: "CREDIT_TOTAL_MISMATCH",
      message: `Grid credits (${gridCredits}) do not match required total (${required})`,
    });
  }

  if (
    extradisciplinaryMeta !== undefined &&
    extradisciplinaryMeta !== extradisciplinaryInGrid
  ) {
    issues.push({
      severity: "error",
      code: "EXTRADISCIPLINARY_MISMATCH",
      message: `meta.extradisciplinaryCredits (${extradisciplinaryMeta}) does not match EEL courses in grid (${extradisciplinaryInGrid})`,
    });
  }

  for (let i = 1; i < curriculum.periods.length; i++) {
    const prev = curriculum.periods[i - 1]!;
    const curr = curriculum.periods[i]!;
    if (curr.order <= prev.order) {
      issues.push({
        severity: "warning",
        code: "PERIOD_ORDER",
        message: `Period "${curr.id}" (order ${curr.order}) is not after "${prev.id}" (order ${prev.order})`,
        periodId: curr.id,
      });
    }
  }

  for (const course of courses) {
    if (course.credits === null) {
      issues.push({
        severity: "error",
        code: "NULL_CREDITS",
        message: `Course "${course.name}" has no credits`,
        courseCode: course.code,
      });
    }

    if (categories && !categories[course.category]) {
      issues.push({
        severity: "error",
        code: "UNKNOWN_CATEGORY",
        message: `Unknown category "${course.category}"`,
        courseCode: course.code,
      });
    }

    for (const item of course.prerequisites) {
      if (Array.isArray(item) && item.length === 0) {
        issues.push({
          severity: "warning",
          code: "EMPTY_OR_GROUP",
          message: "Empty OR prerequisite group",
          courseCode: course.code,
        });
      }
    }

    for (const prereq of collectPrerequisiteCodes(course.prerequisites)) {
      if (prereq === course.code) {
        issues.push({
          severity: "error",
          code: "SELF_PREREQUISITE",
          message: "Course cannot require itself",
          courseCode: course.code,
        });
        continue;
      }

      if (!codeSet.has(prereq)) {
        issues.push({
          severity: "error",
          code: "MISSING_PREREQUISITE",
          message: `Prerequisite "${prereq}" is not defined in the malla`,
          courseCode: course.code,
        });
        continue;
      }

      const coursePeriod = periodByCourse.get(course.code);
      const prereqPeriod = periodByCourse.get(prereq);

      if (
        coursePeriod &&
        prereqPeriod &&
        periodOrder(prereqPeriod) > periodOrder(coursePeriod)
      ) {
        issues.push({
          severity: "warning",
          code: "PREREQUISITE_IN_LATER_PERIOD",
          message: `Prerequisite "${prereq}" is placed in a later period than "${course.code}"`,
          courseCode: course.code,
        });
      }
    }
  }

  for (const cycle of findPrerequisiteCycles(courseIndex)) {
    issues.push({
      severity: "error",
      code: "PREREQUISITE_CYCLE",
      message: `Prerequisite cycle: ${cycle.join(" → ")}`,
      courseCode: cycle[0],
    });
  }

  const valid = !issues.some((issue) => issue.severity === "error");

  return { valid, issues, stats };
}
