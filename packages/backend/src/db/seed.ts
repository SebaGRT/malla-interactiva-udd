import { getDatabase } from "./client.js";
import { careerCount } from "./schema.js";
import { importCareerFromFolder } from "./import-from-json.js";

const DEFAULT_CAREER_FOLDERS = ["iit"] as const;

export async function ensureDatabaseSeeded(
  folders: readonly string[] = DEFAULT_CAREER_FOLDERS,
): Promise<void> {
  const db = getDatabase();

  if (careerCount(db) > 0) {
    return;
  }

  await importAllCareers(folders);
}

export async function importAllCareers(
  folders: readonly string[] = DEFAULT_CAREER_FOLDERS,
): Promise<string[]> {
  const db = getDatabase();
  const imported: string[] = [];

  for (const folder of folders) {
    const code = await importCareerFromFolder(db, folder);
    imported.push(code);
  }

  return imported;
}

export async function runImportCli(): Promise<void> {
  const imported = await importAllCareers();
  console.log(`Imported ${imported.length} career(s): ${imported.join(", ")}`);
}
