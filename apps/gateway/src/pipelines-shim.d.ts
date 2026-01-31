declare module "@lumentrail/pipelines" {
  export type DbConfig = { path: string };
  export type SqliteDb = unknown;
  export type SearchResult = {
    chunkId: string;
    itemId: string;
    text: string;
  };
  export type ExplainResult = {
    chunkId: string;
    itemId: string;
    text: string;
    title: string;
    timestamp: string | null;
    metadata: string | null;
  };

  export function openDb(config: DbConfig): SqliteDb;
  export function ingestFile(db: SqliteDb, filePath: string): { ok: boolean; reason?: string };
  export function scanDirectory(root: string): string[];
  export function searchChunks(db: SqliteDb, query: string, limit?: number): SearchResult[];
  export function explainChunk(db: SqliteDb, chunkId: string): ExplainResult | undefined;
}
