import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CategoriesSchema,
  CurriculumSchema,
  type Categories,
  type Curriculum,
} from "@malla-udd/shared";
import { config } from "../config.js";
import type { AppDatabase } from "./types.js";

export async function readCareerJson(
  careerFolder: string,
): Promise<{ curriculum: Curriculum; categories: Categories }> {
  const dir = path.join(config.dataDir, careerFolder);
  const [curriculumRaw, categoriesRaw] = await Promise.all([
    readFile(path.join(dir, "curriculum.json"), "utf8"),
    readFile(path.join(dir, "categories.json"), "utf8"),
  ]);

  return {
    curriculum: CurriculumSchema.parse(JSON.parse(curriculumRaw)),
    categories: CategoriesSchema.parse(JSON.parse(categoriesRaw)),
  };
}

export function deleteCareerByCode(db: AppDatabase, code: string): void {
  db.prepare("DELETE FROM careers WHERE code = ?").run(code);
}

export function importCareerBundle(
  db: AppDatabase,
  curriculum: Curriculum,
  categories: Categories,
): void {
  db.exec("BEGIN");

  try {
    deleteCareerByCode(db, curriculum.meta.code);

    const careerResult = db
      .prepare(
        `INSERT INTO careers (
          code, name, university, version,
          total_credits_required, extradisciplinary_credits, scheduling_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        curriculum.meta.code,
        curriculum.meta.career,
        curriculum.meta.university,
        curriculum.meta.version,
        curriculum.meta.totalCreditsRequired,
        curriculum.meta.extradisciplinaryCredits ?? null,
        curriculum.meta.scheduling
          ? JSON.stringify(curriculum.meta.scheduling)
          : null,
      );

    const careerId = Number(careerResult.lastInsertRowid);

    const insertCategory = db.prepare(
      `INSERT INTO categories (career_id, code, color, label) VALUES (?, ?, ?, ?)`,
    );
    for (const [code, category] of Object.entries(categories)) {
      insertCategory.run(careerId, code, category.color, category.label);
    }

    const insertRequirement = db.prepare(
      `INSERT INTO requirements (
        career_id, req_id, name, description, spans_semesters_json
      ) VALUES (?, ?, ?, ?, ?)`,
    );
    for (const requirement of curriculum.requirements) {
      insertRequirement.run(
        careerId,
        requirement.id,
        requirement.name,
        requirement.description ?? null,
        requirement.spansSemesters
          ? JSON.stringify(requirement.spansSemesters)
          : null,
      );
    }

    const insertPeriod = db.prepare(
      `INSERT INTO periods (
        career_id, period_id, type, semester, trimester,
        trimester_in_semester, label, period_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const insertCourse = db.prepare(
      `INSERT INTO courses (
        career_id, period_id, code, name, credits, category, offering,
        spans_semesters, spans_trimesters, prerequisites_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (const period of curriculum.periods) {
      insertPeriod.run(
        careerId,
        period.id,
        period.type,
        period.semester,
        period.type === "trimester" ? period.trimester : null,
        period.type === "trimester" ? period.trimesterInSemester : null,
        period.label,
        period.order,
      );

      for (const course of period.courses) {
        insertCourse.run(
          careerId,
          period.id,
          course.code,
          course.name,
          course.credits,
          course.category,
          course.offering,
          course.spansSemesters ?? null,
          course.spansTrimesters ?? null,
          JSON.stringify(course.prerequisites),
        );
      }
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export async function importCareerFromFolder(
  db: AppDatabase,
  careerFolder: string,
): Promise<string> {
  const { curriculum, categories } = await readCareerJson(careerFolder);
  importCareerBundle(db, curriculum, categories);
  return curriculum.meta.code;
}
