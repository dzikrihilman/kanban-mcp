/**
 * Database migration runner
 * Applies pending Drizzle migrations on app startup
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

const DB_PATH = path.join(process.cwd(), "kanban.db");

export function runMigrations() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);

  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  sqlite.close();
}

if (require.main === module) {
  console.log("Running migrations...");
  runMigrations();
  console.log("Migrations complete.");
}
