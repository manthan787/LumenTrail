import Fastify from "fastify";
import cors from "@fastify/cors";
import { openDb, ingestFile, scanDirectory, searchChunks, explainChunk, watchDirectory, listItems, listChunks, ingestText } from "@lumentrail/pipelines";
import { getConnectorRegistry } from "@lumentrail/connectors";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
const dbPath = process.env.LUMENTRAIL_DB_PATH ?? "./data/lumentrail.db";
const db = openDb({ path: dbPath });
let activeWatch: { path: string; close: () => Promise<void> } | null = null;
const connectorRegistry = getConnectorRegistry();
const connectorStatus = new Map<string, { connected: boolean; lastSync?: string; itemCount?: number }>();

app.get("/health", async () => ({ ok: true, service: "gateway" }));

app.get("/api/search", async (req) => {
  const query = (req.query as { q?: string }).q ?? "";
  if (!query.trim()) {
    return { query, results: [] };
  }
  const results = searchChunks(db, query.trim(), 20);
  return { query, results };
});

app.post("/api/ingest/files", async (req, reply) => {
  const body = req.body as { path?: string };
  if (!body?.path) {
    reply.status(400);
    return { ok: false, error: "path_required" };
  }
  const files = scanDirectory(body.path);
  let indexed = 0;
  let skipped = 0;
  for (const filePath of files) {
    const result = ingestFile(db, filePath);
    if (result.ok) indexed += 1;
    else skipped += 1;
  }
  return { ok: true, indexed, skipped };
});

app.post("/api/ingest/batch", async (req, reply) => {
  const body = req.body as {
    items?: Array<{
      id: string;
      source: "files";
      title: string;
      content: string;
      timestamp?: string;
      metadata?: Record<string, unknown>;
    }>;
  };
  if (!body?.items || body.items.length === 0) {
    reply.status(400);
    return { ok: false, error: "items_required" };
  }
  body.items.forEach((item) => {
    ingestText(db, item);
  });
  return { ok: true, ingested: body.items.length };
});

app.post("/api/watch", async (req, reply) => {
  const body = req.body as { path?: string };
  if (!body?.path) {
    reply.status(400);
    return { ok: false, error: "path_required" };
  }
  if (activeWatch) {
    reply.status(409);
    return { ok: false, error: "already_watching", path: activeWatch.path };
  }
  const handle = watchDirectory(body.path, (filePath) => {
    ingestFile(db, filePath);
  });
  activeWatch = { path: body.path, close: handle.close };
  return { ok: true, path: body.path };
});

app.post("/api/watch/stop", async () => {
  if (!activeWatch) {
    return { ok: true, stopped: false };
  }
  await activeWatch.close();
  const stoppedPath = activeWatch.path;
  activeWatch = null;
  return { ok: true, stopped: true, path: stoppedPath };
});

app.get("/api/explain", async (req, reply) => {
  const chunkId = (req.query as { chunkId?: string }).chunkId ?? "";
  if (!chunkId.trim()) {
    reply.status(400);
    return { ok: false, error: "chunk_id_required" };
  }
  const result = explainChunk(db, chunkId.trim());
  if (!result) {
    reply.status(404);
    return { ok: false, error: "chunk_not_found" };
  }
  return { ok: true, result };
});

app.get("/api/items", async (req) => {
  const limit = Number((req.query as { limit?: string }).limit ?? 50);
  const items = listItems(db, Number.isNaN(limit) ? 50 : limit);
  return { items };
});

app.get("/api/chunks", async (req, reply) => {
  const query = req.query as { itemId?: string; limit?: string };
  if (!query.itemId) {
    reply.status(400);
    return { ok: false, error: "item_id_required" };
  }
  const limit = Number(query.limit ?? 50);
  const chunks = listChunks(db, query.itemId, Number.isNaN(limit) ? 50 : limit);
  return { chunks };
});

app.get("/api/connectors", async () => {
  const connectors = connectorRegistry.map((connector) => {
    const status = connectorStatus.get(connector.id);
    return {
      id: connector.id,
      name: connector.name,
      source: connector.source,
      description: connector.description,
      connected: status?.connected ?? false,
      lastSync: status?.lastSync,
      itemCount: status?.itemCount
    };
  });
  return { connectors };
});

app.post("/api/connectors/connect", async (req, reply) => {
  const body = req.body as { id?: string };
  const connector = connectorRegistry.find((entry) => entry.id === body?.id);
  if (!connector) {
    reply.status(404);
    return { ok: false, error: "connector_not_found" };
  }
  const status = await connector.connect();
  connectorStatus.set(connector.id, {
    connected: status.connected,
    lastSync: status.lastSync
  });
  return { ok: true, status };
});

app.post("/api/connectors/sync", async (req, reply) => {
  const body = req.body as { id?: string };
  const connector = connectorRegistry.find((entry) => entry.id === body?.id);
  if (!connector) {
    reply.status(404);
    return { ok: false, error: "connector_not_found" };
  }
  const result = await connector.sync();
  result.items.forEach((item) => {
    ingestText(db, item);
  });
  connectorStatus.set(connector.id, {
    connected: true,
    lastSync: new Date().toISOString(),
    itemCount: result.items.length
  });
  return { ok: true, ingested: result.items.length };
});

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";

app
  .listen({ port, host })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
