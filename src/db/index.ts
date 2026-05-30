import Database from 'better-sqlite3';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const DB_PATH = resolve(process.cwd(), 'data/bot.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
const schemaPath = resolve(process.cwd(), 'src/db/schema.sql');
try {
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
} catch (e) {
  console.error('[DB] Failed to load schema:', (e as Error).message);
}
