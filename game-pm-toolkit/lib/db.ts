import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "app.db");

declare global {
  var __gamePmDb: Database.Database | undefined;
}

function createDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      value REAL NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics_entries(date);
    CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics_entries(metric_name);

    CREATE TABLE IF NOT EXISTS competitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      store_url TEXT,
      memo TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS competitor_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_events_date ON competitor_events(date);
    CREATE INDEX IF NOT EXISTS idx_events_competitor ON competitor_events(competitor_id);

    CREATE TABLE IF NOT EXISTS feedback_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      impact TEXT NOT NULL DEFAULT 'mid',
      status TEXT NOT NULL DEFAULT 'collected',
      priority_score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_items(status);
  `);

  return db;
}

const db = globalThis.__gamePmDb ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalThis.__gamePmDb = db;
}

export default db;
