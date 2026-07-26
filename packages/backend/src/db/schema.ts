import type { AppDatabase } from "./types.js";

export function initializeSchema(db: AppDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS careers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      university TEXT NOT NULL,
      version TEXT NOT NULL,
      total_credits_required INTEGER NOT NULL,
      extradisciplinary_credits INTEGER,
      scheduling_json TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      career_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      color TEXT NOT NULL,
      label TEXT NOT NULL,
      PRIMARY KEY (career_id, code),
      FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      career_id INTEGER NOT NULL,
      req_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      spans_semesters_json TEXT,
      FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE,
      UNIQUE (career_id, req_id)
    );

    CREATE TABLE IF NOT EXISTS periods (
      career_id INTEGER NOT NULL,
      period_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('semester', 'trimester')),
      semester INTEGER NOT NULL,
      trimester INTEGER,
      trimester_in_semester INTEGER,
      label TEXT NOT NULL,
      period_order INTEGER NOT NULL,
      PRIMARY KEY (career_id, period_id),
      FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      career_id INTEGER NOT NULL,
      period_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      credits INTEGER,
      category TEXT NOT NULL,
      offering TEXT NOT NULL DEFAULT 'A',
      spans_semesters INTEGER,
      spans_trimesters INTEGER,
      prerequisites_json TEXT NOT NULL DEFAULT '[]',
      FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE,
      FOREIGN KEY (career_id, period_id) REFERENCES periods(career_id, period_id) ON DELETE CASCADE,
      UNIQUE (career_id, code)
    );

    CREATE INDEX IF NOT EXISTS idx_courses_career ON courses(career_id);
    CREATE INDEX IF NOT EXISTS idx_periods_career_order ON periods(career_id, period_order);
  `);
}

export function careerCount(db: AppDatabase): number {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM careers")
    .get() as { count: number };
  return row.count;
}
