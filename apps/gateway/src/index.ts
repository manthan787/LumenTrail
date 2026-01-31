import Fastify from "fastify";
import cors from "@fastify/cors";
import { openDb, ingestFile, scanDirectory, searchChunks, explainChunk } from "@lumentrail/pipelines";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
const dbPath = process.env.LUMENTRAIL_DB_PATH ?? "./data/lumentrail.db";
const db = openDb({ path: dbPath });

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

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";

app
  .listen({ port, host })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
