import type {
  Categories,
  CategoryCourseProgress,
  Course,
  CourseEligibility,
  CreditSummary,
  Curriculum,
} from "../schemas/curriculum.js";
import {
  buildCurriculumIndexes,
  type CurriculumIndexes,
} from "./curriculum-indexes.js";
import {
  arePrerequisitesMet,
  getUnmetPrerequisiteGroups,
} from "./prerequisite-engine.js";

export function buildCourseIndex(curriculum: Curriculum): Map<string, Course> {
  return buildCurriculumIndexes(curriculum).courseIndex;
}

export function sumGridCredits(curriculum: Curriculum): number {
  return buildCurriculumIndexes(curriculum).gridCreditsTotal;
}

export function getExtradisciplinaryCredits(curriculum: Curriculum): number {
  return buildCurriculumIndexes(curriculum).extradisciplinaryCredits;
}

function resolveIndexes(
  curriculum: Curriculum,
  indexes?: CurriculumIndexes,
): CurriculumIndexes {
  return indexes ?? buildCurriculumIndexes(curriculum);
}

export function evaluateEligibility(
  curriculum: Curriculum,
  approvedCodes: readonly string[],
  indexes?: CurriculumIndexes,
): CourseEligibility[] {
  const approved = new Set(approvedCodes);
  const { courses } = resolveIndexes(curriculum, indexes);

  return courses.map((course) => {
    if (approved.has(course.code)) {
      return {
        code: course.code,
        name: course.name,
        status: "approved",
        missingPrerequisites: [],
      };
    }

    const missing = getUnmetPrerequisiteGroups(course.prerequisites, approved);

    return {
      code: course.code,
      name: course.name,
      status: missing.length === 0 ? "available" : "blocked",
      missingPrerequisites: missing,
    };
  });
}

export function calculateCredits(
  curriculum: Curriculum,
  categories: Categories,
  approvedCodes: readonly string[],
  indexes?: CurriculumIndexes,
): CreditSummary {
  const approved = new Set(approvedCodes);
  const resolved = resolveIndexes(curriculum, indexes);
  const { courseIndex, gridCreditsTotal, extradisciplinaryCredits } = resolved;

  let approvedCredits = 0;
  const byCategory: CreditSummary["byCategory"] = {};

  for (const code of approved) {
    const course = courseIndex.get(code);
    if (!course || course.credits === null) {
      continue;
    }

    approvedCredits += course.credits;

    const categoryMeta = categories[course.category];
    if (!byCategory[course.category]) {
      byCategory[course.category] = {
        approved: 0,
        label: categoryMeta?.label ?? course.category,
        color: categoryMeta?.color ?? "#607d8b",
      };
    }

    byCategory[course.category].approved += course.credits;
  }

  const required = curriculum.meta.totalCreditsRequired;
  const remaining = Math.max(required - approvedCredits, 0);
  const progressPercent =
    required > 0 ? Math.round((approvedCredits / required) * 100) : 0;

  return {
    approved: approvedCredits,
    required,
    remaining,
    progressPercent,
    gridCreditsTotal,
    extradisciplinaryCredits,
    byCategory,
  };
}

export function calculateCategoryCourseProgress(
  curriculum: Curriculum,
  categories: Categories,
  approvedCodes: readonly string[],
  indexes?: CurriculumIndexes,
): CategoryCourseProgress[] {
  const approved = new Set(approvedCodes);
  const { courses } = resolveIndexes(curriculum, indexes);
  const totals = new Map<string, number>();
  const approvedByCategory = new Map<string, number>();

  for (const course of courses) {
    totals.set(course.category, (totals.get(course.category) ?? 0) + 1);

    if (approved.has(course.code)) {
      approvedByCategory.set(
        course.category,
        (approvedByCategory.get(course.category) ?? 0) + 1,
      );
    }
  }

  return Object.keys(categories).map((categoryCode) => {
    const totalCount = totals.get(categoryCode) ?? 0;
    const approvedCount = approvedByCategory.get(categoryCode) ?? 0;
    const meta = categories[categoryCode];
    const progressPercent =
      totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

    return {
      categoryCode,
      label: meta?.label ?? categoryCode,
      color: meta?.color ?? "#607d8b",
      approvedCount,
      totalCount,
      progressPercent,
    };
  });
}

export function validateApprovedCodes(
  curriculum: Curriculum,
  approvedCodes: readonly string[],
  indexes?: CurriculumIndexes,
): { valid: string[]; unknown: string[] } {
  const courseIndex = resolveIndexes(curriculum, indexes).courseIndex;
  const valid: string[] = [];
  const unknown: string[] = [];

  for (const code of approvedCodes) {
    if (courseIndex.has(code)) {
      valid.push(code);
    } else {
      unknown.push(code);
    }
  }

  return { valid, unknown };
}

export function isCourseAvailable(
  course: Course,
  approvedCodes: ReadonlySet<string>,
): boolean {
  return arePrerequisitesMet(course.prerequisites, approvedCodes);
}
