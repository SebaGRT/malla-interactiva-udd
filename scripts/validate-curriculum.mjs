#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  CurriculumSchema,
  CategoriesSchema,
  validateCurriculum,
} from "../packages/shared/dist/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const curriculum = CurriculumSchema.parse(
  JSON.parse(await readFile(path.join(root, "data/iit/curriculum.json"), "utf8")),
);
const categories = CategoriesSchema.parse(
  JSON.parse(await readFile(path.join(root, "data/iit/categories.json"), "utf8")),
);

const report = validateCurriculum(curriculum, { categories });
const { stats } = report;

console.log("IIT curriculum validation\n");
console.log(`  Courses:              ${stats.courseCount}`);
console.log(
  `  Periods:              ${stats.periodCount} (${stats.semesterPeriodCount} semesters + ${stats.trimesterPeriodCount} trimesters)`,
);
console.log(`  Grid credits:         ${stats.gridCredits}`);
console.log(
  `  Extradisciplinares:   ${stats.extradisciplinaryInGrid} in grid (meta: ${stats.extradisciplinaryCredits})`,
);
console.log(
  `  Degree total:         ${stats.gridCredits} / ${stats.requiredCredits} required`,
);

const errors = report.issues.filter((i) => i.severity === "error");
const warnings = report.issues.filter((i) => i.severity === "warning");

if (warnings.length) {
  console.log("\nWarnings:");
  for (const w of warnings) {
    console.log(`  ⚠ [${w.code}] ${w.message}`);
  }
}

if (errors.length) {
  console.log("\nErrors:");
  for (const e of errors) {
    console.log(`  ✗ [${e.code}] ${e.message}`);
  }
  process.exit(1);
}

console.log("\n  ✓ All checks passed");
process.exit(0);
