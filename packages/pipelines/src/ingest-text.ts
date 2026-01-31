import { Chunk, Item } from "@lumentrail/sdk";
import { chunkText } from "./chunk.js";

export function ingestText(
  db: any,
  params: {
    id: string;
    source: Item["source"];
    title: string;
    content: string;
    author?: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const item: Item = {
    id: params.id,
    source: params.source,
    title: params.title,
    author: params.author,
    timestamp: params.timestamp,
    content: params.content,
    metadata: params.metadata
  };

  const insertItem = db.prepare(
    `INSERT OR REPLACE INTO items (id, source, title, author, timestamp, content, metadata, permissions)
     VALUES (@id, @source, @title, @author, @timestamp, @content, @metadata, @permissions)`
  );

  const insertChunk = db.prepare(
    `INSERT OR REPLACE INTO chunks (chunk_id, item_id, text, start, end, citations)
     VALUES (@chunkId, @itemId, @text, @start, @end, @citations)`
  );

  const chunks = chunkText(item.content);
  const transaction = db.transaction(() => {
    insertItem.run({
      ...item,
      metadata: JSON.stringify(item.metadata ?? {}),
      permissions: JSON.stringify(item.permissions ?? [])
    });

    chunks.forEach((entry, index) => {
      const chunk: Chunk = {
        itemId: item.id,
        chunkId: `${item.id}:chunk:${index}`,
        text: entry.text,
        span: { start: entry.start, end: entry.end }
      };
      insertChunk.run({
        chunkId: chunk.chunkId,
        itemId: chunk.itemId,
        text: chunk.text,
        start: chunk.span?.start ?? null,
        end: chunk.span?.end ?? null,
        citations: JSON.stringify(chunk.citations ?? [])
      });
    });
  });

  transaction();

  return { ok: true } as const;
}
