import { fileURLToPath } from "node:url";
import path from "node:path";

function resolveRepoRoot(): string {
  if (process.env.VERCEL === "1" || process.env.DATA_DIR) {
    return process.cwd();
  }

  const packageDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(packageDir, "../../..");
}

function resolveDataDir(repoRoot: string): string {
  if (!process.env.DATA_DIR) {
    return path.join(repoRoot, "data");
  }

  return path.isAbsolute(process.env.DATA_DIR)
    ? process.env.DATA_DIR
    : path.resolve(process.cwd(), process.env.DATA_DIR);
}

/** Repo root (packages/backend/src -> ../../..) */
export const repoRoot = resolveRepoRoot();
const dataDir = resolveDataDir(repoRoot);

export const config = {
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 3001),
  dataDir,
  databasePath: process.env.DATABASE_PATH ?? path.join(dataDir, "malla.db"),
  /** Import JSON into SQLite on startup when the database is empty */
  dbAutoSeed: process.env.DB_AUTO_SEED !== "false",
  /** `json` loads curriculum from data folders — used on Vercel (no SQLite). */
  curriculumSource:
    process.env.CURRICULUM_SOURCE === "json" ? "json" : "sqlite",
  isVercel: process.env.VERCEL === "1",
} as const;
