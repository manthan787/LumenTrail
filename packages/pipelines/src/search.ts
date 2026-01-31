export type SearchResult = {
  chunkId: string;
  itemId: string;
  text: string;
};

export function searchChunks(db: any, query: string, limit = 20) {
  const stmt = db.prepare(
    `SELECT chunk_id as chunkId, item_id as itemId, text
     FROM chunks
     WHERE text LIKE ?
     LIMIT ?`
  );
  return stmt.all(`%${query}%`, limit) as SearchResult[];
}

export type ExplainResult = {
  chunkId: string;
  itemId: string;
  text: string;
  title: string;
  timestamp: string | null;
  metadata: string | null;
};

export function explainChunk(db: any, chunkId: string) {
  const stmt = db.prepare(
    `SELECT chunks.chunk_id as chunkId,
            chunks.item_id as itemId,
            chunks.text as text,
            items.title as title,
            items.timestamp as timestamp,
            items.metadata as metadata
     FROM chunks
     JOIN items ON items.id = chunks.item_id
     WHERE chunks.chunk_id = ?
     LIMIT 1`
  );
  return stmt.get(chunkId) as ExplainResult | undefined;
}
