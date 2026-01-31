# LumenTrail

Local-first Personal Research OS with provenance, citations, and explainable answers.

## Why this exists
LumenTrail turns your scattered knowledge (Slack, Drive, Notion, and local files) into a single, trustworthy research brain. Every answer is backed by sources you can inspect.

## Viral hook
One-click **Explain this answer**: exact snippets + timeline of reasoning and tool usage.

## Stack (initial)
- UI: Next.js app router
- Gateway: Fastify API
- Data: SQLite + vector extension (planned)
- Monorepo: pnpm workspaces

## Repo layout
- `apps/gateway` – control plane API + orchestration
- `apps/ui` – web dashboard
- `packages/sdk` – shared types + connector interfaces
- `packages/connectors` – source integrations (scaffold)
- `packages/pipelines` – parsing + chunking + indexing (scaffold)
- `docs` – architecture + roadmap

## Getting started
```bash
pnpm install
pnpm dev
```

Gateway: `http://127.0.0.1:8787/health`
UI: `http://localhost:3000`

## Status
Scaffolding in progress.
