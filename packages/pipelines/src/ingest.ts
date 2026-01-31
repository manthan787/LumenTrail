import { readFileSync, statSync } from "node:fs";
import { extname, basename } from "node:path";
import { Item, Chunk } from "@lumentrail/sdk";
import type { SqliteDb } from "./db.js";

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md"]);

export function ingestFile(db: SqliteDb, filePath: string) {
  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    return { ok: false, reason: "unsupported_extension" } as const;
  }

  const stat = statSync(filePath);
  const content = readFileSync(filePath, "utf-8");
  const item: Item = {
    id: `files:${filePath}`,
    source: "files",
    title: basename(filePath),
    timestamp: stat.mtime.toISOString(),
    content,
    metadata: { path: filePath, size: stat.size }
  };

  const chunk: Chunk = {
    itemId: item.id,
    chunkId: `${item.id}:chunk:0`,
    text: content.slice(0, 4000),
    span: { start: 0, end: Math.min(4000, content.length) }
  };

  const insertItem = db.prepare(
    `INSERT OR REPLACE INTO items (id, source, title, author, timestamp, content, metadata, permissions)
     VALUES (@id, @source, @title, @author, @timestamp, @content, @metadata, @permissions)`
  );

  const insertChunk = db.prepare(
    `INSERT OR REPLACE INTO chunks (chunk_id, item_id, text, start, end, citations)
     VALUES (@chunkId, @itemId, @text, @start, @end, @citations)`
  );

  insertItem.run({
    ...item,
    metadata: JSON.stringify(item.metadata ?? {}),
    permissions: JSON.stringify(item.permissions ?? [])
  });

  insertChunk.run({
    chunkId: chunk.chunkId,
    itemId: chunk.itemId,
    text: chunk.text,
    start: chunk.span?.start ?? null,
    end: chunk.span?.end ?? null,
    citations: JSON.stringify(chunk.citations ?? [])
  });

  return { ok: true } as const;
}
