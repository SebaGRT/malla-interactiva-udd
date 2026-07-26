import type { Course, Curriculum, Period } from "../schemas/curriculum.js";
import { buildCoursePeriodMap, flattenCourses } from "../utils/curriculum.js";

export interface CurriculumIndexes {
  courseIndex: Map<string, Course>;
  periodMap: Map<string, Period>;
  courses: Course[];
  gridCreditsTotal: number;
  extradisciplinaryCredits: number;
}

export function buildCurriculumIndexes(
  curriculum: Curriculum,
): CurriculumIndexes {
  const courseIndex = new Map<string, Course>();
  let gridCreditsTotal = 0;

  for (const course of flattenCourses(curriculum)) {
    if (!courseIndex.has(course.code)) {
      courseIndex.set(course.code, course);
      if (course.credits !== null) {
        gridCreditsTotal += course.credits;
      }
    }
  }

  return {
    courseIndex,
    periodMap: buildCoursePeriodMap(curriculum),
    courses: [...courseIndex.values()],
    gridCreditsTotal,
    extradisciplinaryCredits: curriculum.meta.extradisciplinaryCredits ?? 0,
  };
}
