# AI Setup

context-engine ships first-class AI agent configurations alongside its source code. Two tools are configured out of the box — Claude Code and OpenCode — and no additional setup is required beyond authenticating with your AI provider.

This document explains what is configured, why it exists, how to use it, and how to request support for additional tools.

See [CONTRIBUTING.md](CONTRIBUTING.md) for environment setup, dependency installation, and the general development workflow.

---

## Table of Contents

- [Why this project ships AI configs](#why-this-project-ships-ai-configs)
- [Supported tools](#supported-tools)
- [Quick start](#quick-start)
- [How the AI system works](#how-the-ai-system-works)
  - [Agents](#agents)
  - [Skills](#skills)
  - [Rules](#rules)
  - [The workflow contract](#the-workflow-contract)
- [Slash commands reference](#slash-commands-reference)
- [Practical examples](#practical-examples)
- [What the AI does not do](#what-the-ai-does-not-do)
- [Requesting support for another AI tool](#requesting-support-for-another-ai-tool)

---

## Why this project ships AI configs

Most open-source projects leave AI tooling entirely to the individual contributor. The result is that every contributor configures their own system prompts, if they use AI at all, with no shared understanding of the codebase conventions, domain concepts, or quality expectations.

context-engine takes a different approach: the AI configuration is treated as part of the repository, the same way `tsconfig.json` or `.eslintrc` is. This means:

- **Consistency.** Every contributor who uses the AI tooling gets the same domain knowledge, the same quality bar, and the same conventions applied automatically.
- **Lower barrier to entry.** A new contributor can ask the AI to implement a GitHub issue or review a PR without first spending hours reading architecture documents. The agents have already read them.
- **Explicit conventions.** The rules that the AI follows are plain Markdown files in `.claude/rules/`. They are readable, reviewable, and improvable by any contributor — making implicit team knowledge explicit.

This pattern is genuinely uncommon in open-source software. It is not a gimmick; it reflects how this project is actually developed.

---

## Supported tools

### Claude Code

Claude Code is Anthropic's official CLI for Claude.

| Property    | Value                                   |
| ----------- | --------------------------------------- |
| Config dir  | `.claude/`                              |
| Run command | `claude`                                |
| Install     | `npm install -g @anthropic/claude-code` |

The `.claude/` directory is checked into the repository. No manual configuration is needed after installation.

### OpenCode

OpenCode is an open-source AI coding tool that supports multiple model providers.

| Property    | Value                        |
| ----------- | ---------------------------- |
| Config dir  | `.opencode/`                 |
| Config file | `opencode.json`              |
| Run command | `opencode`                   |
| Install     | `npm install -g opencode-ai` |

Both `opencode.json` and the `.opencode/` directory are checked into the repository. No manual configuration is needed after installation.

Both tools share the same underlying agent, skill, and rule architecture. The configurations mirror each other intentionally so that contributors using either tool get an equivalent experience.

---

## Quick start

**1. Authenticate with GitHub** (required for issue and PR commands):

```bash
gh auth login
```

This uses browser-based OAuth. No personal access token is required.

**2. Install your preferred tool:**

```bash
# Claude Code
npm install -g @anthropic/claude-code

# OpenCode
npm install -g opencode-ai
```

**3. Start the tool from the repository root:**

```bash
# Claude Code
claude

# OpenCode
opencode
```

On first run, the tool will prompt you to authenticate with your AI model provider. Follow the on-screen instructions.

That is all that is required. The agents, skills, and rules load automatically from the checked-in configuration.

---

## How the AI system works

The AI configuration is organized into three layers: **agents**, **skills**, and **rules**. Understanding these layers helps you use the tooling effectively and contribute improvements to it.

### Agents

Agents are specialized AI personas that get delegated to automatically based on the type of task. Each agent has a defined focus area, a set of skills it can execute, and a no-shortcuts policy that prevents it from taking low-quality paths when it encounters difficulty.

| Agent                 | Role                                    | Auto-delegated when                     |
| --------------------- | --------------------------------------- | --------------------------------------- |
| `principal-architect` | System design, scalability, tradeoffs   | Architecture decisions, design planning |
| `sde2`                | Implementation, code quality, bug fixes | Code changes, PR reviews, fixing issues |
| `tester`              | Test strategy and implementation        | Writing or reviewing tests              |
| `technical-writer`    | Documentation accuracy and completeness | Updating docs after code changes        |
| `devops`              | Dependencies, CI/CD, infrastructure     | Dependency analysis, pipeline changes   |

You do not select agents manually. When you run a slash command, the command dispatches to the appropriate agent or agents automatically.

Agent definitions live in `.claude/agents/`. Each file is a plain Markdown document describing the agent's persona, principles, and quality standards. They are readable and open to contribution.

### Skills

Skills are reusable capability modules that agents load when executing a task. A skill defines a structured workflow — what the agent should research, what steps to follow, what output to produce, and how to handle errors.

| Skill                 | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `implement`           | Feature implementation from issues, specs, or conversation |
| `implement-test`      | Test implementation for existing code                      |
| `pr-review`           | Dual-perspective review (Architect + SDE2)                 |
| `pr-review-follow-up` | Re-review after feedback has been addressed                |
| `pr-fix`              | Fix issues identified in a PR review                       |
| `design-plan`         | Architecture planning before implementation begins         |
| `update-docs`         | Update documentation after codebase changes                |
| `analyze-deps`        | Dependency analysis and migration reports                  |

Skill definitions live in `.claude/skills/`. You generally do not invoke skills directly — slash commands invoke them through the appropriate agent.

### Rules

Rules are convention files that every agent reads before starting any task. They encode the project's domain knowledge, coding patterns, and quality expectations in plain language.

| Rule file                      | Purpose                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `workflow.md`                  | The phase-based execution contract (see below)                       |
| `context-engine.md`            | Domain knowledge: AI-first APIs, core concepts, architecture         |
| `context-engine-api.md`        | API patterns: Hono route structure, MCP server, endpoint conventions |
| `context-engine-database.md`   | Database patterns: Drizzle ORM, pgvector, repository structure       |
| `context-engine-embeddings.md` | Embedding patterns: chunking strategies, vector search               |
| `testing.md`                   | Testing philosophy, patterns, and conventions                        |
| `github.md`                    | PR format, commit conventions, branch naming                         |

Rules live in `.claude/rules/`. Improving a rule is a legitimate contribution — if the AI is following a convention incorrectly or a convention has changed, updating the relevant rule file is the right fix.

### The workflow contract

All agents follow the same phase-based execution workflow defined in `workflow.md`. Understanding this workflow sets accurate expectations for how AI-assisted tasks proceed.

```
Plan    → The agent creates a structured plan before writing any code
WAIT    → The agent stops and presents the plan for your review
Execute → You approve; the agent completes one phase of work
WAIT    → The agent summarizes what changed and stops again
Repeat  → You approve; the next phase begins
```

**The WAIT steps are not optional.** The workflow is designed so that you review and approve before each phase of execution. The AI will not proceed automatically from one phase to the next.

This means:

- You remain in control at every significant step
- You can redirect or stop at any WAIT point
- The AI produces incremental, reviewable output rather than large unreviewed changesets

For commands that involve an architect planning phase (e.g., `/implement #42 --with-architect`), there is an additional WAIT after the plan is produced and before implementation begins. The implementation does not start until you explicitly approve the plan.

---

## Slash commands reference

Slash commands are the primary interface for AI-assisted work. Type them in the tool's chat input.

### Implementation

| Command                           | What it does                                                  |
| --------------------------------- | ------------------------------------------------------------- |
| `/implement #42`                  | Fetch GitHub issue #42 and implement it using the SDE2 agent  |
| `/implement #42 --with-architect` | Architect produces a plan first; you approve; SDE2 implements |
| `/implement ./specs/feature.md`   | Implement from a local markdown spec file                     |
| `/implement`                      | Implement from the current conversation context               |

### Testing

| Command           | What it does                                                 |
| ----------------- | ------------------------------------------------------------ |
| `/implement-test` | Write tests for the code in the current conversation context |

### PR review and fixes

| Command                    | What it does                                                        |
| -------------------------- | ------------------------------------------------------------------- |
| `/pr-review 5`             | Full dual-agent review of PR #5 (Principal Architect + SDE2)        |
| `/pr-review 5 --follow-up` | Re-review PR #5 after feedback has been addressed; only new files   |
| `/pr-fix 5`                | Address review comments on PR #5; blocking issues first, then minor |

### Documentation and dependencies

| Command         | What it does                                                   |
| --------------- | -------------------------------------------------------------- |
| `/update-docs`  | Discover and update documentation affected by recent changes   |
| `/analyze-deps` | Analyze dependencies for outdated packages and migration paths |

---

## Practical examples

### Implementing a GitHub issue

```
/implement #84
```

The SDE2 agent fetches issue #84, reads the relevant rules for the files it expects to change, creates a plan, and presents it for your review. After you approve, it implements one phase at a time, summarizing changes and waiting for your confirmation before proceeding.

For issues that involve architectural decisions or new patterns:

```
/implement #84 --with-architect
```

The Principal Architect agent runs first, researches the existing architecture, and produces a phased implementation plan. You review and approve the plan before the SDE2 agent begins writing any code.

### Reviewing a pull request

```
/pr-review 12
```

Both the Principal Architect and the SDE2 agent review PR #12 independently and produce structured feedback. The Architect focuses on design, scalability, and architectural concerns. The SDE2 focuses on implementation quality, type safety, error handling, and test coverage.

After you push fixes based on the review:

```
/pr-review 12 --follow-up
```

The follow-up review looks only at files changed since the last review and verifies that each raised issue has been addressed.

### Fixing review comments

```
/pr-fix 12
```

The SDE2 agent reads the review comments on PR #12 and addresses them in priority order — blocking issues first, then minor issues. It stops for your confirmation between each fix.

### Updating documentation after a refactor

```
/update-docs
```

The Technical Writer agent inspects recent git changes, discovers which documentation files are affected, compares them against the current code, and proposes specific edits. It presents all proposed changes for your review before applying any of them.

---

## What the AI does not do

It is worth being explicit about the boundaries:

- **The AI does not push code.** All git operations remain in your hands.
- **The AI does not merge pull requests.** You review and merge.
- **The AI does not approve its own plans.** Every WAIT point requires a human response.
- **The AI does not skip the workflow.** Agents are configured to surface uncertainty rather than guess. If an agent encounters a situation where the right answer is unclear, it asks rather than proceeding.
- **The AI does not replace code review.** `/pr-review` produces structured feedback for a human reviewer. The output is a starting point for human judgment, not a substitute for it.
- **The AI makes mistakes.** Treat its output the same way you would treat a pull request from a teammate: read it, think critically, and approve only what you understand and agree with.

---

## Requesting support for another AI tool

If you use a different AI coding tool — Cursor, Windsurf, GitHub Copilot Workspace, Gemini CLI, or others — and want first-class configuration support for it in this repository, open a GitHub issue with the label `ai-setup`.

In the issue, describe:

1. **Which tool** you want support for
2. **Why it would benefit contributors** — who uses it, what it does well for this kind of project
3. **What the configuration looks like** — the equivalent of `.claude/` for that tool (config directory, config file format, how agents/rules/prompts are specified)

Providing the third point significantly accelerates adding support, because the core agents, skills, and rules only need to be translated into the target tool's format — the underlying content already exists.

Issues without the `ai-setup` label may not be seen by the maintainers who handle this area of the project.
