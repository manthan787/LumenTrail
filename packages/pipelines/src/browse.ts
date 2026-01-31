export type ItemSummary = {
  id: string;
  source: string;
  title: string;
  timestamp: string | null;
};

export type ChunkSummary = {
  chunkId: string;
  text: string;
  start: number | null;
  end: number | null;
};

export function listItems(db: any, limit = 50) {
  const stmt = db.prepare(
    `SELECT id, source, title, timestamp
     FROM items
     ORDER BY timestamp DESC
     LIMIT ?`
  );
  return stmt.all(limit) as ItemSummary[];
}

export function listChunks(db: any, itemId: string, limit = 50) {
  const stmt = db.prepare(
    `SELECT chunk_id as chunkId, text, start, end
     FROM chunks
     WHERE item_id = ?
     ORDER BY start ASC
     LIMIT ?`
  );
  return stmt.all(itemId, limit) as ChunkSummary[];
}
