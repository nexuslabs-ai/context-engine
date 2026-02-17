# @context-engine/db

Database layer for Context Engine. PostgreSQL + pgvector for semantic search and vector similarity.

## Overview

Provides the database schema, client connection, and repository layer for Context Engine. Built with Drizzle ORM on PostgreSQL with pgvector for embedding storage and similarity search.

## Schema

| Table           | Description                                          |
| --------------- | ---------------------------------------------------- |
| `organizations` | Multi-tenant org records                             |
| `api_keys`      | Auth tokens scoped to orgs                           |
| `components`    | Component manifests (extraction + generation output) |
| `embeddings`    | Vector embeddings for semantic search                |

## Setup

```bash
# 1. Start postgres + pgvector
yarn docker:up          # from repo root

# 2. Copy env
cp .env.example .env    # set DATABASE_URL

# 3. Run migrations
yarn db:migrate
```

## Scripts

| Command            | Description                             |
| ------------------ | --------------------------------------- |
| `yarn build`       | Build the package                       |
| `yarn db:push`     | Push Drizzle schema directly (dev only) |
| `yarn db:generate` | Generate migration files                |
| `yarn db:migrate`  | Run pending migrations                  |
| `yarn db:studio`   | Open Drizzle Studio (visual DB browser) |
| `yarn typecheck`   | TypeScript check                        |
| `yarn lint`        | ESLint                                  |

## Environment Variables

| Variable       | Description                  |
| -------------- | ---------------------------- |
| `DATABASE_URL` | PostgreSQL connection string |

Example: `postgresql://context_engine:context_engine_dev@localhost:5432/context_engine`

## Usage

```typescript
import { createDbClient } from '@context-engine/db';
import { ComponentRepository } from '@context-engine/db';

const db = createDbClient(process.env.DATABASE_URL);
const repo = new ComponentRepository(db);

const components = await repo.findByOrg('org-id');
```

## License

AGPL-3.0 — see [LICENSE](../../LICENSE)
