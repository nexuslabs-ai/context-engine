# @context-engine/server

Hono HTTP API and MCP server for Context Engine.

## Overview

Provides two interfaces for accessing component knowledge:

- **HTTP API** — REST endpoints for component CRUD, search, and processing. Used by dashboards and integrations.
- **MCP Server** — Model Context Protocol server. AI tools (Claude, Cursor, Copilot) connect here to query components in real time.

## Starting the Server

```bash
# Development (with hot reload)
yarn dev

# Production
yarn build && yarn start
```

Or from repo root:

```bash
yarn server:dev
yarn server:start
```

## Environment Variables

| Variable       | Required | Description                       |
| -------------- | -------- | --------------------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection string      |
| `LLM_API_KEY`  | Yes      | API key for LLM generation        |
| `LLM_PROVIDER` | No       | `anthropic` (default) or `google` |
| `PORT`         | No       | HTTP port (default 3000)          |
| `NODE_ENV`     | No       | `development` or `production`     |

## API Endpoints

| Method | Path                  | Description                  |
| ------ | --------------------- | ---------------------------- |
| `GET`  | `/health`             | Health check                 |
| `GET`  | `/api/components`     | List components for an org   |
| `GET`  | `/api/components/:id` | Get component by ID          |
| `POST` | `/api/processing`     | Trigger component processing |
| `GET`  | `/api/search`         | Semantic component search    |
| `GET`  | `/mcp`                | MCP WebSocket endpoint       |

Full OpenAPI docs available at `/docs` when running in development.

## MCP Integration

Connect any MCP-compatible AI tool to `ws://localhost:3000/mcp`.

Tools exposed:

- `search_components` — semantic search across the component catalog
- `get_component` — retrieve full manifest for a component by name
- `find_similar` — find components similar to a given description
- `get_index_stats` — component catalog statistics

## Scripts

| Command          | Description             |
| ---------------- | ----------------------- |
| `yarn dev`       | Start with hot reload   |
| `yarn start`     | Start production server |
| `yarn build`     | Build with tsup         |
| `yarn typecheck` | TypeScript check        |
| `yarn lint`      | ESLint                  |

## License

AGPL-3.0 — see [LICENSE](../../LICENSE)
