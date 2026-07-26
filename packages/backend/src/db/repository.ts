import type { AppDatabase } from "./types.js";
import {
  CategoriesSchema,
  CurriculumSchema,
  type Categories,
  type Course,
  type Period,
  type Prerequisite,
} from "@malla-udd/shared";
import type { CareerBundle } from "../services/curriculum-loader.js";

interface CareerRow {
  id: number;
  code: string;
  name: string;
  university: string;
  version: string;
  total_credits_required: number;
  extradisciplinary_credits: number | null;
  scheduling_json: string | null;
}

interface CategoryRow {
  code: string;
  color: string;
  label: string;
}

interface RequirementRow {
  req_id: string;
  name: string;
  description: string | null;
  spans_semesters_json: string | null;
}

interface PeriodRow {
  period_id: string;
  type: "semester" | "trimester";
  semester: number;
  trimester: number | null;
  trimester_in_semester: number | null;
  label: string;
  period_order: number;
}

interface CourseRow {
  period_id: string;
  code: string;
  name: string;
  credits: number | null;
  category: string;
  offering: "P" | "I" | "A";
  spans_semesters: number | null;
  spans_trimesters: number | null;
  prerequisites_json: string;
}

function parsePrerequisites(raw: string): Prerequisite[] {
  return JSON.parse(raw) as Prerequisite[];
}

function rowToCourse(row: CourseRow): Course {
  return {
    code: row.code,
    name: row.name,
    credits: row.credits,
    category: row.category,
    prerequisites: parsePrerequisites(row.prerequisites_json),
    offering: row.offering,
    ...(row.spans_semesters != null
      ? { spansSemesters: row.spans_semesters }
      : {}),
    ...(row.spans_trimesters != null
      ? { spansTrimesters: row.spans_trimesters }
      : {}),
  };
}

function rowToPeriod(row: PeriodRow, courses: Course[]): Period {
  if (row.type === "semester") {
    return {
      id: row.period_id,
      type: "semester",
      semester: row.semester,
      label: row.label,
      order: row.period_order,
      courses,
    };
  }

  return {
    id: row.period_id,
    type: "trimester",
    semester: row.semester,
    trimesterInSemester: row.trimester_in_semester ?? 1,
    trimester: row.trimester ?? row.period_order,
    label: row.label,
    order: row.period_order,
    courses,
  };
}

export function loadCareerBundleFromDb(
  db: AppDatabase,
  code: string,
): CareerBundle | undefined {
  const career = db
    .prepare(
      `SELECT id, code, name, university, version,
              total_credits_required, extradisciplinary_credits, scheduling_json
       FROM careers WHERE lower(code) = lower(?)`,
    )
    .get(code) as CareerRow | undefined;

  if (!career) {
    return undefined;
  }

  const categoryRows = db
    .prepare(
      `SELECT code, color, label FROM categories WHERE career_id = ? ORDER BY code`,
    )
    .all(career.id) as unknown as CategoryRow[];

  const categories: Categories = {};
  for (const row of categoryRows) {
    categories[row.code] = { color: row.color, label: row.label };
  }

  const requirementRows = db
    .prepare(
      `SELECT req_id, name, description, spans_semesters_json
       FROM requirements WHERE career_id = ? ORDER BY id`,
    )
    .all(career.id) as unknown as RequirementRow[];

  const periodRows = db
    .prepare(
      `SELECT period_id, type, semester, trimester, trimester_in_semester, label, period_order
       FROM periods WHERE career_id = ? ORDER BY period_order`,
    )
    .all(career.id) as unknown as PeriodRow[];

  const courseRows = db
    .prepare(
      `SELECT period_id, code, name, credits, category, offering,
              spans_semesters, spans_trimesters, prerequisites_json
       FROM courses WHERE career_id = ?`,
    )
    .all(career.id) as unknown as CourseRow[];

  const coursesByPeriod = new Map<string, Course[]>();
  for (const row of courseRows) {
    const list = coursesByPeriod.get(row.period_id) ?? [];
    list.push(rowToCourse(row));
    coursesByPeriod.set(row.period_id, list);
  }

  const periods = periodRows.map((row) =>
    rowToPeriod(row, coursesByPeriod.get(row.period_id) ?? []),
  );

  const curriculum = CurriculumSchema.parse({
    meta: {
      university: career.university,
      career: career.name,
      code: career.code,
      version: career.version,
      totalCreditsRequired: career.total_credits_required,
      ...(career.extradisciplinary_credits != null
        ? { extradisciplinaryCredits: career.extradisciplinary_credits }
        : {}),
      ...(career.scheduling_json
        ? { scheduling: JSON.parse(career.scheduling_json) }
        : {}),
    },
    requirements: requirementRows.map((row) => ({
      id: row.req_id,
      name: row.name,
      ...(row.description ? { description: row.description } : {}),
      ...(row.spans_semesters_json
        ? { spansSemesters: JSON.parse(row.spans_semesters_json) }
        : {}),
    })),
    periods,
  });

  return {
    curriculum,
    categories: CategoriesSchema.parse(categories),
  };
}

export function listCareerCodesFromDb(db: AppDatabase): string[] {
  const rows = db
    .prepare("SELECT code FROM careers ORDER BY code")
    .all() as Array<{ code: string }>;
  return rows.map((row) => row.code);
}
