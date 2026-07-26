import type { Curriculum, Period } from "../schemas/curriculum.js";

export function flattenCourses(curriculum: Curriculum) {
  return curriculum.periods.flatMap((period) => period.courses);
}

export function buildCoursePeriodMap(
  curriculum: Curriculum,
): Map<string, Period> {
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

export function isSemesterPeriod(
  period: Period,
): period is Extract<Period, { type: "semester" }> {
  return period.type === "semester";
}

export function isTrimesterPeriod(
  period: Period,
): period is Extract<Period, { type: "trimester" }> {
  return period.type === "trimester";
}

export function getSemesterPeriods(curriculum: Curriculum) {
  return curriculum.periods.filter(isSemesterPeriod);
}

export function getTrimesterPeriods(curriculum: Curriculum) {
  return curriculum.periods.filter(isTrimesterPeriod);
}
