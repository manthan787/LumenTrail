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

export type Query = {
  prompt: string;
  sources?: SourceType[];
  results?: Chunk[];
  citations?: string[];
  artifacts?: Record<string, unknown>;
};

export type ConnectorStatus = {
  id: string;
  name: string;
  source: SourceType;
  connected: boolean;
  lastSync?: string;
  itemCount?: number;
  error?: string;
};

export type Connector = {
  id: string;
  name: string;
  source: SourceType;
  description: string;
};
