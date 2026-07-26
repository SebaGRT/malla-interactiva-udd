import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { initializeSchema } from "./schema.js";
import type { AppDatabase } from "./types.js";

let db: AppDatabase | undefined;

export function getDatabase(): AppDatabase {
  if (db) {
    return db;
  }

  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });

  db = new DatabaseSync(config.databasePath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");
  initializeSchema(db);

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = undefined;
  }
}
