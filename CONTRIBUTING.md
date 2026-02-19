# Contributing to Context Engine

Thanks for your interest in contributing! This guide covers everything you need to get started.

This repository ships first-class AI agent configurations for Claude Code and OpenCode. See [AI_SETUP.md](AI_SETUP.md) for setup instructions, a commands reference, and how to request support for other AI tools.

---

## 1. Before You Contribute

### Sign the CLA

All contributors must sign the [Contributor License Agreement](./CLA.md) before their pull request can be merged. The **CLA Assistant bot** will prompt you to sign electronically on your first PR — it only takes a moment.

### Code of Conduct

Please review our Code of Conduct before participating. _(See `CODE_OF_CONDUCT.md` — coming soon.)_

---

## 2. Development Setup

**Prerequisites:** Node >= 20.19.0, Yarn 1.22.22, Docker

```bash
git clone https://github.com/nexus-labs/context-engine
cd context-engine
yarn install
cp .env.example .env   # fill in your values
yarn docker:up         # start postgres + pgvector
yarn db:migrate        # run migrations
```

---

## 3. Package Structure

| Package           | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| `packages/core`   | Extraction, generation, manifest, and pipeline orchestration |
| `packages/db`     | Drizzle ORM + pgvector schema and repositories               |
| `packages/server` | Hono HTTP API + MCP server                                   |

---

## 4. Making Changes

Work in a feature branch:

```bash
git checkout -b feat/your-feature
```

Each package has its own `yarn build`, `yarn typecheck`, and `yarn lint` scripts. To build all packages in dependency order, run from the repo root:

```bash
yarn build
```

Before opening a PR, make sure everything passes:

```bash
yarn lint
yarn typecheck
```

---

## 5. Pull Request Guidelines

- **One PR per logical change** — keep scope focused
- **PR title format:** `type(scope): description`
  - Examples: `feat(core): add chunking strategy`, `fix(server): handle empty manifest`
  - Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`
- **Link relevant issues** in the PR body (e.g., `Closes #42`)
- The CLA bot will check your signature — sign if prompted

---

## 6. Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add support for Vue component extraction
fix(db): handle null embedding vectors
docs: update quickstart in README
```

---

## 7. Reporting Issues

- **Bug reports:** Open a [GitHub Issue](https://github.com/nexus-labs/context-engine/issues). Include reproduction steps, your Node version, and the full error output.
- **Feature requests:** Start a [GitHub Discussion](https://github.com/nexus-labs/context-engine/discussions) before filing an issue — it helps us align on scope first.
- **Security vulnerabilities:** Email [security@nexuslabs.dev](mailto:security@nexuslabs.dev). Please **do not** open a public issue for security reports.

---

## 8. License

By contributing, you agree that your contributions will be licensed under the **GNU Affero General Public License v3 (AGPL v3)**, as described in the [CLA](./CLA.md).
