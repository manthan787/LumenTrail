declare module "@lumentrail/sdk" {
  export type SourceType = "slack" | "drive" | "notion" | "files";

  export type Item = {
    id: string;
    source: SourceType;
    title: string;
    author?: string;
    timestamp?: string;
    content: string;
    metadata?: Record<string, unknown>;
    permissions?: string[];
  };

  export type Chunk = {
    itemId: string;
    chunkId: string;
    text: string;
    embedding?: number[];
    span?: { start: number; end: number };
    citations?: string[];
  };
}
