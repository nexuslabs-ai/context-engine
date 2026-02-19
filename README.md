# Context Engine

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

Context Engine makes component libraries AI-accessible. AI coding assistants (Claude, Cursor, Copilot) hallucinate props and miss variants when working with custom design systems — because they have no knowledge of your components. Context Engine solves this by extracting accurate component metadata from source code and serving it to AI tools via MCP, so they generate correct code using your actual API.

## How It Works

```
Your Component Code
       ↓
┌─────────────┐   ┌─────────────┐   ┌──────────────┐
│  Extractor  │ → │  Generator  │ → │   Manifest   │
│ react-docgen│   │ Anthropic / │   │   Builder    │
│ + ts-morph  │   │   Gemini    │   │              │
└─────────────┘   └─────────────┘   └──────────────┘
                                            ↓
                               ┌────────────────────────┐
                               │      MCP Server        │
                               │ AI tools query in real │
                               │  time via WebSocket    │
                               └────────────────────────┘
```

## Packages

| Package                  | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `@context-engine/core`   | Extraction pipeline, LLM generation, manifest building |
| `@context-engine/db`     | PostgreSQL + pgvector schema and repositories          |
| `@context-engine/server` | Hono HTTP API + MCP server                             |

## Quickstart

**Prerequisites:** Node >= 20.19.0, Yarn 1.22.22, Docker

```bash
git clone https://github.com/nexus-labs/context-engine
cd context-engine
yarn install
cp .env.example .env   # add your LLM_API_KEY and DATABASE_URL
yarn docker:up         # start postgres + pgvector
yarn db:migrate        # run schema migrations
yarn server:dev        # start the server on :3000
```

## Environment Variables

| Variable       | Required | Description                                |
| -------------- | -------- | ------------------------------------------ |
| `DATABASE_URL` | Yes      | PostgreSQL connection string               |
| `LLM_API_KEY`  | Yes      | Anthropic or Google API key for generation |
| `LLM_PROVIDER` | No       | `anthropic` (default) or `google`          |
| `PORT`         | No       | Server port (default 3000)                 |

See [`.env.example`](.env.example) for a full example with default values.

## Development

```bash
yarn build          # Build all packages
yarn dev            # Watch mode
yarn lint           # ESLint
yarn typecheck      # TypeScript check
yarn format         # Prettier
yarn docker:up      # Start postgres
yarn docker:down    # Stop postgres
yarn db:migrate     # Run migrations
yarn server:dev     # Start server in dev mode
```

## Contributing

Sign the [CLA](CLA.md), read [CONTRIBUTING.md](CONTRIBUTING.md), then open a PR. All contributions are welcome.

Claude Code and OpenCode AI agent configurations are included out of the box — see [AI_SETUP.md](AI_SETUP.md) for the setup guide and slash commands reference.

## License

[AGPL v3](LICENSE) — free to use and modify, but any service built on top must also be open source under AGPL v3.
