export type SearchResult = {
  chunkId: string;
  itemId: string;
  text: string;
  score: number;
};

export function searchChunks(db: any, query: string, limit = 20) {
  const stmt = db.prepare(
    `SELECT chunk_id as chunkId, item_id as itemId, text
     FROM chunks
     WHERE text LIKE ?
     LIMIT ?`
  );
  const raw = stmt.all(`%${query}%`, limit * 5) as Array<{
    chunkId: string;
    itemId: string;
    text: string;
  }>;
  const scored = raw.map((row) => ({
    ...row,
    score: countOccurrences(row.text, query)
  }));
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
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

function countOccurrences(text: string, needle: string) {
  if (!needle.trim()) return 0;
  const haystack = text.toLowerCase();
  const target = needle.toLowerCase();
  let count = 0;
  let index = 0;
  while (true) {
    index = haystack.indexOf(target, index);
    if (index === -1) break;
    count += 1;
    index += target.length;
  }
  return count;
}
