# LumenTrail

[![CI](https://github.com/manthan787/LumenTrail/actions/workflows/ci.yml/badge.svg)](https://github.com/manthan787/LumenTrail/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/manthan787/LumenTrail)](https://github.com/manthan787/LumenTrail/releases)
[![License](https://img.shields.io/github/license/manthan787/LumenTrail)](LICENSE)

Local-first personal research OS with provenance, citations, and explainable answers.

## Overview
LumenTrail turns your scattered knowledge (Slack, Drive, Notion, and local files) into a single, trustworthy research workspace. Every answer is backed by sources you can inspect.

## Features (MVP)
- Unified search and Q&A across connected sources
- Evidence-backed answers with citations and source snippets
- Lightweight web dashboard
- Background ingestion with incremental sync

## Stack (initial)
- UI: Next.js app router
- Gateway: Fastify API
- Data: SQLite (local-first), vector index planned
- Monorepo: pnpm workspaces

## Repo layout
- `apps/gateway` – control plane API + orchestration
- `apps/ui` – web dashboard
- `packages/sdk` – shared types + connector interfaces
- `packages/connectors` – source integrations (scaffold)
- `packages/pipelines` – parsing + chunking + indexing
- `docs` – architecture + roadmap

## Getting started
```bash
pnpm install
pnpm dev
```

Gateway: `http://127.0.0.1:8787/health`
UI: `http://localhost:3000`

## Scripts
- `pnpm dev` – run all apps in dev mode
- `pnpm build` – build all packages/apps
- `pnpm typecheck` – run typechecks across the workspace

## Contributing
Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

1. Fork the repo and create your branch: `git checkout -b feature/your-feature`
2. Install dependencies: `pnpm install`
3. Make changes with tests/typechecks: `pnpm -r typecheck`
4. Commit with a clear message and open a PR

## Roadmap
See `docs/roadmap.md` for planned milestones.

## License
MIT. See `LICENSE` for details.
