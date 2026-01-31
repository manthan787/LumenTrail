import Database from "better-sqlite3";
import type * as BetterSqlite3 from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type DbConfig = {
  path: string;
};

export type SqliteDb = BetterSqlite3.Database;

export function openDb(config: DbConfig) {
  mkdirSync(dirname(config.path), { recursive: true });
  const db = new Database(config.path);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      timestamp TEXT,
      content TEXT NOT NULL,
      metadata TEXT,
      permissions TEXT
    );
    CREATE TABLE IF NOT EXISTS chunks (
      chunk_id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      text TEXT NOT NULL,
      start INTEGER,
      end INTEGER,
      citations TEXT,
      FOREIGN KEY (item_id) REFERENCES items(id)
    );
    CREATE INDEX IF NOT EXISTS chunks_text_idx ON chunks(text);
  `);
  return db;
}
