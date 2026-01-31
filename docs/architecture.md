# Architecture

## Pipelines
- Ingestion: Fetch -> Parse -> Normalize -> Chunk -> Embed -> Store
- Query: Intent -> Retrieve -> Rank -> Synthesize -> Cite -> Deliver

## Storage
- MVP: SQLite + vector extension (local-first)
- Upgrade path: Postgres + pgvector

## UX hooks
- Explain this answer: show snippets + reasoning timeline
- Tool registry: detect missing sources and suggest connect
