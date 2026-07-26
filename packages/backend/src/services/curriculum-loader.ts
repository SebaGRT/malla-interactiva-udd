import { readdir } from "node:fs/promises";
import {
  CareerSummarySchema,
  flattenCourses,
  getSemesterPeriods,
  getTrimesterPeriods,
  type CareerSummary,
  type Categories,
  type Curriculum,
} from "@malla-udd/shared";
import { readCareerJson } from "../db/import-from-json.js";
import { getDatabase } from "../db/client.js";
import {
  listCareerCodesFromDb,
  loadCareerBundleFromDb,
} from "../db/repository.js";
import { ensureDatabaseSeeded } from "../db/seed.js";
import { config } from "../config.js";

export interface CareerBundle {
  curriculum: Curriculum;
  categories: Categories;
}

const careers: Record<string, CareerBundle> = {};

export async function loadCareers(): Promise<void> {
  if (config.curriculumSource === "json") {
    await loadCareersFromJson();
    return;
  }

  await loadCareersFromSqlite();
}

async function loadCareersFromJson(): Promise<void> {
  const entries = await readdir(config.dataDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    try {
      const bundle = await readCareerJson(entry.name);
      careers[bundle.curriculum.meta.code.toLowerCase()] = bundle;
    } catch {
      // Omite las carpetas que no tengan una pareja válida de malla y categorías.
    }
  }
}

async function loadCareersFromSqlite(): Promise<void> {
  if (config.dbAutoSeed) {
    await ensureDatabaseSeeded();
  }

  const db = getDatabase();
  const codes = listCareerCodesFromDb(db);

  for (const code of codes) {
    const bundle = loadCareerBundleFromDb(db, code);
    if (bundle) {
      careers[code.toLowerCase()] = bundle;
    }
  }
}

export function getCareer(code: string): CareerBundle | undefined {
  return careers[code.toLowerCase()];
}

export function listCareers(): CareerSummary[] {
  return Object.values(careers).map(({ curriculum }) => {
    const courses = flattenCourses(curriculum);

    return CareerSummarySchema.parse({
      code: curriculum.meta.code,
      name: curriculum.meta.career,
      university: curriculum.meta.university,
      version: curriculum.meta.version,
      totalCreditsRequired: curriculum.meta.totalCreditsRequired,
      periodCount: curriculum.periods.length,
      semesterPeriodCount: getSemesterPeriods(curriculum).length,
      trimesterPeriodCount: getTrimesterPeriods(curriculum).length,
      courseCount: courses.length,
      scheduling: curriculum.meta.scheduling,
    });
  });
}

export function getAllCareers(): Record<string, CareerBundle> {
  return careers;
}
