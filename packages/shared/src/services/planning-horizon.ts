import type { CourseEligibility, Curriculum, Period } from "../schemas/curriculum.js";
import type { CurriculumIndexes } from "./curriculum-indexes.js";
import { buildCurriculumIndexes } from "./curriculum-indexes.js";
import { arePrerequisitesMet } from "./prerequisite-engine.js";

function resolveIndexes(
  curriculum: Curriculum,
  indexes?: CurriculumIndexes,
): CurriculumIndexes {
  return indexes ?? buildCurriculumIndexes(curriculum);
}

/**
 * Furthest academic semester reached by any approved course.
 * Defaults to 1 when nothing is approved yet (Semestre I).
 */
export function getPlanningAnchorSemester(
  curriculum: Curriculum,
  approvedCodes: readonly string[],
  indexes?: CurriculumIndexes,
): number {
  const periodMap = resolveIndexes(curriculum, indexes).periodMap;
  return getPlanningAnchorFromPeriodMap(approvedCodes, periodMap);
}

export function getPlanningAnchorFromPeriodMap(
  approvedCodes: Iterable<string>,
  periodMap: Map<string, Period>,
): number {
  let anchor = 1;

  for (const code of approvedCodes) {
    const period = periodMap.get(code);
    if (period && period.semester > anchor) {
      anchor = period.semester;
    }
  }

  return anchor;
}

/**
 * Last semester number the student may plan in (one academic year ahead).
 * Semestre I → through Semestre IV; Semestre III → through VI, etc.
 */
export function getMaxAllowedSemester(anchorSemester: number): number {
  const academicYear = Math.ceil(anchorSemester / 2);
  return (academicYear + 1) * 2;
}

export function isPeriodWithinPlanningHorizon(
  period: Period,
  maxAllowedSemester: number,
): boolean {
  return period.semester <= maxAllowedSemester;
}

export function canInteractWithCourse(
  curriculum: Curriculum,
  courseCode: string,
  approvedCodes: ReadonlySet<string>,
  indexes?: CurriculumIndexes,
): boolean {
  if (approvedCodes.has(courseCode)) {
    return true;
  }

  const resolved = resolveIndexes(curriculum, indexes);
  const course = resolved.courseIndex.get(courseCode);
  if (!course) {
    return false;
  }

  const period = resolved.periodMap.get(courseCode);
  if (!period) {
    return false;
  }

  const anchor = getPlanningAnchorFromPeriodMap(
    approvedCodes,
    resolved.periodMap,
  );
  const maxAllowed = getMaxAllowedSemester(anchor);
  if (!isPeriodWithinPlanningHorizon(period, maxAllowed)) {
    return false;
  }

  return arePrerequisitesMet(course.prerequisites, approvedCodes);
}

export type PeriodSelectionState = "none" | "partial" | "all";

export function getPeriodSelectionState(
  period: Period,
  approvedCodes: ReadonlySet<string>,
): PeriodSelectionState {
  if (period.courses.length === 0) {
    return "none";
  }

  const approvedInPeriod = period.courses.filter((course) =>
    approvedCodes.has(course.code),
  ).length;

  if (approvedInPeriod === 0) {
    return "none";
  }

  if (approvedInPeriod === period.courses.length) {
    return "all";
  }

  return "partial";
}

function canInteractWithCourseIndexed(
  courseCode: string,
  approvedCodes: ReadonlySet<string>,
  indexes: CurriculumIndexes,
): boolean {
  if (approvedCodes.has(courseCode)) {
    return true;
  }

  const course = indexes.courseIndex.get(courseCode);
  if (!course) {
    return false;
  }

  const period = indexes.periodMap.get(courseCode);
  if (!period) {
    return false;
  }

  const anchor = getPlanningAnchorFromPeriodMap(
    approvedCodes,
    indexes.periodMap,
  );
  const maxAllowed = getMaxAllowedSemester(anchor);
  if (!isPeriodWithinPlanningHorizon(period, maxAllowed)) {
    return false;
  }

  return arePrerequisitesMet(course.prerequisites, approvedCodes);
}

/**
 * If every course in the period is approved, clears them all.
 * Otherwise approves every course that becomes eligible (respecting prereqs and horizon).
 */
export function togglePeriodApprovals(
  curriculum: Curriculum,
  periodId: string,
  approvedCodes: ReadonlySet<string>,
  indexes?: CurriculumIndexes,
): Set<string> {
  const resolved = resolveIndexes(curriculum, indexes);
  const period = curriculum.periods.find((entry) => entry.id === periodId);
  if (!period || period.courses.length === 0) {
    return new Set(approvedCodes);
  }

  const periodCodes = period.courses.map((course) => course.code);
  const allApproved = periodCodes.every((code) => approvedCodes.has(code));
  const next = new Set(approvedCodes);

  if (allApproved) {
    for (const code of periodCodes) {
      next.delete(code);
    }
    return next;
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const code of periodCodes) {
      if (
        !next.has(code) &&
        canInteractWithCourseIndexed(code, next, resolved)
      ) {
        next.add(code);
        changed = true;
      }
    }
  }

  return next;
}

export function applyPlanningHorizon(
  eligibility: CourseEligibility[],
  curriculum: Curriculum,
  approvedCodes: readonly string[],
  indexes?: CurriculumIndexes,
): CourseEligibility[] {
  const resolved = resolveIndexes(curriculum, indexes);
  const anchor = getPlanningAnchorFromPeriodMap(
    approvedCodes,
    resolved.periodMap,
  );
  const maxAllowed = getMaxAllowedSemester(anchor);
  const { periodMap } = resolved;

  return eligibility.map((entry) => {
    if (entry.status === "approved") {
      return entry;
    }

    const period = periodMap.get(entry.code);
    if (period && period.semester > maxAllowed) {
      return { ...entry, status: "beyond_horizon" };
    }

    return entry;
  });
}
