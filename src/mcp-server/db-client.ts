/**
 * Kanban MCP Server - Database Client
 * Standalone DB access for the MCP server process (separate from Next.js)
 * Shares the same SQLite database file (kanban.db)
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../lib/db/schema";
import path from "path";
import { fileURLToPath } from "url";

// Resolve project root from this file's location: src/mcp-server/db-client.ts -> project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../../");
const DB_PATH = path.join(PROJECT_ROOT, "kanban.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };
