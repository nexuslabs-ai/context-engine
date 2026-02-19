# GitHub Integration Rules

## Repository Info

| Field       | Value            |
| ----------- | ---------------- |
| Owner       | `nexus-labs`     |
| Repo        | `context-engine` |
| Main Branch | `main`           |

## PR Title Format

PR titles use conventional commit format — no ticket ID required:

```
{type}({scope}): {description}
```

**Examples:**

- `feat(server): add component search endpoint`
- `fix(db): correct pgvector index configuration`
- `ci: setup GitHub Actions workflow`

### Commit Type Mapping

| Change Type    | Commit Type     |
| -------------- | --------------- |
| Feature        | `feat`          |
| Bug            | `fix`           |
| Infrastructure | `chore` or `ci` |
| Documentation  | `docs`          |
| Refactor       | `refactor`      |

## PR Body Template

Standard PR body structure:

```markdown
## Summary

{bullet points of what changed}

## GitHub Issue

Closes #123

## Test Plan

- [ ] {verification step 1}
- [ ] {verification step 2}

🤖 Generated with Claude Code
```

## Closing Issues via PR

Use `Closes #123` in the PR body — GitHub automatically closes the issue when the PR merges.

| Keyword         | Effect on Merge  |
| --------------- | ---------------- |
| `Closes #123`   | Closes the issue |
| `Fixes #123`    | Closes the issue |
| `Resolves #123` | Closes the issue |

**Always use `Closes #123` in the "GitHub Issue" section.** Prefer `Closes` for consistency.

## Branch Naming

Derive branch name from the GitHub issue:

```
{username}/issue-{number}-{slugified-title}
```

**Example:** `prasad/issue-42-add-keyword-search-endpoint`

Or use the GitHub CLI to generate the branch automatically:

```bash
gh issue develop 42
```

## Issue Labels

| Label              | Usage                                 |
| ------------------ | ------------------------------------- |
| `bug`              | Something is broken or incorrect      |
| `enhancement`      | New feature or improvement            |
| `good first issue` | Suitable for new contributors         |
| `question`         | Further information needed            |
| `documentation`    | Documentation-only changes            |
| `help wanted`      | Extra attention needed from community |

## Issue Extraction

When extracting a GitHub issue number from a PR or user input:

| Source     | Pattern                     | Priority        |
| ---------- | --------------------------- | --------------- |
| PR Body    | `Closes #123`, `Fixes #123` | 1st (preferred) |
| PR Body    | `#123` (standalone)         | 2nd             |
| User Input | Direct input                | Fallback        |

**Extraction order:**

1. Check PR body for `Closes #123` or `Fixes #123`
2. Check PR body for standalone `#123`
3. If not found, ask user

## MCP Tool Reference

### Fetching Issues

```
mcp__github__get_issue(
  owner: "nexus-labs",
  repo: "context-engine",
  issue_number: 123
)
```

Key fields to extract:

- `title`, `body` — Issue details and requirements
- `labels` — Issue classification
- `state` — `open` or `closed`

### Adding Comments to Issues

```
mcp__github__add_issue_comment(
  owner: "nexus-labs",
  repo: "context-engine",
  issue_number: 123,
  body: "Comment text..."
)
```

### Creating PRs

```
mcp__github__create_pull_request(
  owner: "nexus-labs",
  repo: "context-engine",
  title: "{conventional commit title}",
  head: "{branch_name}",
  base: "main",
  body: "{PR body with Closes #123}"
)
```

### Fetching PR Details

```
mcp__github__get_pull_request(
  owner: "nexus-labs",
  repo: "context-engine",
  pull_number: {pr_number}
)
```

Key fields:

- `title` — PR title
- `body` — PR description (extract issue number from `Closes #123`)
- `merged_at` — Merge timestamp (null if not merged)
- `head.ref` — Branch name

### Fetching PR Files

```
mcp__github__get_pull_request_files(
  owner: "nexus-labs",
  repo: "context-engine",
  pull_number: {pr_number}
)
```

### Creating PR Reviews

```
mcp__github__create_pull_request_review(
  owner: "nexus-labs",
  repo: "context-engine",
  pull_number: {pr_number},
  body: "{review summary}",
  event: "{APPROVE|COMMENT|REQUEST_CHANGES}",
  comments: [
    { path: "file.ts", line: 42, body: "Issue..." }
  ]
)
```

### Review Verdicts

| Condition         | Event             |
| ----------------- | ----------------- |
| No issues found   | `APPROVE`         |
| Minor issues only | `COMMENT`         |
| Blocking issues   | `REQUEST_CHANGES` |

## Commit Message Format

```
{type}({scope}): {description}

{body - what was done}

Closes #{issue_number}

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Example:**

```
feat(server): add keyword search endpoint

- Implements GET /search with query + filter params
- Backed by pgvector cosine similarity
- Returns ranked component matches with metadata

Closes #42

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Branch Operations

### Push with Upstream

```bash
git push -u origin {branch_name}
```

### Delete Remote Branch (post-merge)

```bash
git push origin --delete {branch_name}
```

## PR Review Body Template

```markdown
## 🤖 Automated Code Review

### Summary

| Category     | Status   | Issues  |
| ------------ | -------- | ------- |
| Architecture | {status} | {notes} |
| Code Quality | {status} | {notes} |
| Testing      | {status} | {notes} |
| Security     | {status} | {notes} |

### Verdict: {APPROVED|CHANGES REQUESTED|REVIEWED}

{issues or approval message}

---

_Review performed against: `.claude/rules/context-engine.md`, `.claude/rules/context-engine-api.md`, etc._
```

## Do Not

- Forget `Closes #123` in PR body (breaks auto-close on merge)
- Use `Fixes` inconsistently (prefer `Closes` for consistency)
- Skip the Test Plan section
- Forget `Co-Authored-By` in commits
- Add ticket IDs to PR titles (this is OSS — no Linear IDs)
