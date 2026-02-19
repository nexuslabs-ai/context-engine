# Context Engine

> **CRITICAL:** Follow [.claude/rules/workflow.md](.claude/rules/workflow.md) for every task.

## Core Operating Principles

These principles are non-negotiable. They apply to ALL work in this codebase.

### Quality Over Speed

**We don't care about token usage or time. Quality is more important than speed at any cost.**

- Never use shortcuts to get things done
- Find the root cause of problems, don't just patch symptoms
- Discuss proper solutions with the user when unsure
- A proper fix is worth 10x the effort of a hack

### Delegate to Agents

**Always delegate specialized work to the appropriate agent.** Do not attempt to do it yourself.

| Task Type              | Delegate To         |
| ---------------------- | ------------------- |
| Code implementation    | sde2                |
| Test implementation    | tester              |
| Architecture decisions | principal-architect |
| Documentation updates  | technical-writer    |
| Dependency analysis    | devops              |

### No Shortcuts Policy

When encountering errors, test failures, or challenges:

| Shortcut ❌                     | Proper Approach ✅                 |
| ------------------------------- | ---------------------------------- |
| Weaken assertions to pass tests | Fix the underlying code or fixture |
| Add `.skip` to failing tests    | Understand and fix the root cause  |
| Use `as any` for type errors    | Fix the type properly              |
| Quick patch to satisfy review   | Implement proper solution          |
| Guess when unsure               | ASK the user instead               |

---

A SaaS platform that makes design system components AI-accessible. Built as a Yarn/Turbo monorepo. Licensed AGPL v3.

## Project Structure

```
context-engine/
├── packages/
│   ├── core/     # Extraction pipeline, LLM generation, manifest building
│   ├── db/       # Drizzle ORM schema, pgvector, repositories
│   └── server/   # Hono HTTP API + MCP server
├── docker/
│   ├── docker-compose.yml  # Postgres + pgvector
│   ├── Dockerfile.server   # Multi-stage server image
│   └── init.sql            # pgvector extension init
├── .github/
│   └── workflows/ci.yml    # lint, format, build, typecheck
├── .claude/
│   ├── agents/   # Agent personas (sde2, principal-architect, etc.)
│   ├── commands/ # Slash commands (/implement, /pr-review, etc.)
│   ├── rules/    # Convention rules
│   └── skills/   # Auto-discovered capabilities (SKILL.md format)
└── Root configs  # turbo.json, tsconfig.base.json, eslint.config.js
```

## Tech Stack

- **Node.js** >= 20.19.0 with TypeScript 5.9
- **Hono** for HTTP API (lightweight, edge-ready)
- **MCP SDK** (`@modelcontextprotocol/sdk`) for AI tool integration
- **Drizzle ORM** with pgvector for semantic search
- **PostgreSQL** + pgvector extension
- **tsup** for package builds (ESM + CJS output)
- **Turbo** 2.7 for monorepo orchestration
- **Vitest** for testing
- **Zod** + `@hono/zod-openapi` for schema validation and OpenAPI docs

## Commands

```bash
# Build & Development
yarn build          # Build all packages
yarn dev            # Dev mode (watch)
yarn typecheck      # TypeScript check
yarn lint           # ESLint
yarn format         # Prettier

# Docker
yarn docker:up      # Start postgres + pgvector
yarn docker:down    # Stop containers
yarn docker:logs    # Tail container logs

# Database
yarn db:push        # Push schema (dev)
yarn db:generate    # Generate migrations
yarn db:migrate     # Run migrations
yarn db:studio      # Drizzle Studio UI

# Server
yarn server:dev     # Dev server with hot reload (:3000)
yarn server:start   # Production server
```

## Package Documentation

| Package                  | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `@context-engine/core`   | Extraction pipeline, LLM generation, manifest |
| `@context-engine/db`     | PostgreSQL + pgvector schema and repositories |
| `@context-engine/server` | Hono HTTP API + MCP server                    |

## Convention Rules

| Rule File                                                                                | Purpose                                        |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [.claude/rules/workflow.md](.claude/rules/workflow.md)                                   | **Critical workflow (plan→execute→wait)**      |
| [.claude/rules/context-engine.md](.claude/rules/context-engine.md)                       | Domain knowledge, AI-first APIs, core concepts |
| [.claude/rules/context-engine-api.md](.claude/rules/context-engine-api.md)               | API patterns (Hono, MCP, endpoints, auth)      |
| [.claude/rules/context-engine-database.md](.claude/rules/context-engine-database.md)     | Database patterns (Drizzle, pgvector, schema)  |
| [.claude/rules/context-engine-embeddings.md](.claude/rules/context-engine-embeddings.md) | Embedding patterns (chunking, vector search)   |
| [.claude/rules/testing.md](.claude/rules/testing.md)                                     | Core testing philosophy                        |
| [.claude/rules/github.md](.claude/rules/github.md)                                       | PR format, commit conventions, issue linking   |

## Skills (Auto-Discovered)

| Skill                                                              | Purpose                                   |
| ------------------------------------------------------------------ | ----------------------------------------- |
| [pr-review](.claude/skills/pr-review/SKILL.md)                     | PR review framework                       |
| [pr-review-follow-up](.claude/skills/pr-review-follow-up/SKILL.md) | Follow-up review verification             |
| [implement](.claude/skills/implement/SKILL.md)                     | Feature implementation                    |
| [implement-test](.claude/skills/implement-test/SKILL.md)           | Test implementation                       |
| [pr-fix](.claude/skills/pr-fix/SKILL.md)                           | Fix PR review issues                      |
| [design-plan](.claude/skills/design-plan/SKILL.md)                 | Architecture planning                     |
| [update-docs](.claude/skills/update-docs/SKILL.md)                 | Documentation updates                     |
| [analyze-deps](.claude/skills/analyze-deps/SKILL.md)               | Dependency analysis and migration reports |

## Agents (Auto-Delegated)

| Agent                                                        | Skills                                            | Focus                        |
| ------------------------------------------------------------ | ------------------------------------------------- | ---------------------------- |
| [principal-architect](.claude/agents/principal-architect.md) | pr-review, pr-review-follow-up, design-plan       | Architecture, scalability    |
| [sde2](.claude/agents/sde2.md)                               | pr-review, pr-review-follow-up, implement, pr-fix | Code quality, implementation |
| [tester](.claude/agents/tester.md)                           | implement-test                                    | Test strategy, quality       |
| [technical-writer](.claude/agents/technical-writer.md)       | update-docs                                       | Documentation accuracy       |
| [devops](.claude/agents/devops.md)                           | analyze-deps                                      | Infrastructure, dependencies |

## Slash Commands

| Command           | Agent(s) Used              | Purpose                                                      |
| ----------------- | -------------------------- | ------------------------------------------------------------ |
| `/implement`      | SDE2 (+ Architect w/flag)  | Implement GitHub issue or spec (optional `--with-architect`) |
| `/implement-test` | Tester                     | Implement tests from plan or context                         |
| `/pr-review`      | Principal Architect + SDE2 | Dual-perspective PR code review                              |
| `/pr-fix`         | SDE2                       | Fix PR review issues (blocking first, then minor)            |
| `/update-docs`    | Technical Writer           | Update documentation after codebase changes                  |
| `/analyze-deps`   | DevOps                     | Analyze dependencies for updates and migration paths         |

## Code Style

### Formatting (Prettier)

- Single quotes, semicolons, 2-space indent
- 80 char line width, trailing commas (es5)

### Naming

- **Files**: kebab-case (`component-repository.ts`)
- **Types/interfaces**: PascalCase (`ComponentMeta`)
- **Variables/functions**: camelCase (`searchComponents`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_CHUNK_SIZE`)
- **Env vars**: SCREAMING_SNAKE_CASE (`DATABASE_URL`)

### Import Order (ESLint auto-sorts)

1. Node built-ins
2. External packages
3. Internal (`@context-engine/*`)
4. Parent/sibling imports

## Architecture Overview

```
HTTP Request → Hono Router → Middleware (auth, CORS) → Route Handler
                                                              ↓
                                                    Repository (Drizzle)
                                                              ↓
                                                      PostgreSQL + pgvector
```

- **core** has no runtime dependencies on db or server — pure extraction + generation logic
- **db** depends on core types only
- **server** depends on both core and db
- MCP server and HTTP API share the same Hono app instance

## Notes

- Node >= 20.19.0 required
- Requires running postgres with pgvector (`yarn docker:up`)
- AGPL v3 licensed — all contributions require CLA (see `CLA.md`)
- See `CONTRIBUTING.md` for setup and PR guidelines
- See `AI_SETUP.md` for AI tool setup, commands reference, and how to request support for other AI tools
