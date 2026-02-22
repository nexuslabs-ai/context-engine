# PR Review

Comprehensive code review using dual-agent analysis. Auto-detects context based on changed files.

## Agents Used

| Agent                                                   | Skill                                     | Perspective                  |
| ------------------------------------------------------- | ----------------------------------------- | ---------------------------- |
| [Principal Architect](../agents/principal-architect.md) | [pr-review](../skills/pr-review/SKILL.md) | Architecture & system design |
| [SDE2](../agents/sde2.md)                               | [pr-review](../skills/pr-review/SKILL.md) | Code quality & correctness   |

## Required Input

- **PR Number**: $ARGUMENTS (e.g., `5`)
- **Optional flag**: `--follow-up` or `-f` for re-review after changes

```
Examples:
  /pr-review 5                → Full review (first time)
  /pr-review 5 --follow-up    → Follow-up review (after changes pushed)
  /pr-review 5 -f             → Follow-up (short flag)
```

If no input provided, ask the user for the PR number.

## Mode Detection

| Flag                 | Mode             | Behavior                              |
| -------------------- | ---------------- | ------------------------------------- |
| (none)               | Full Review      | Both agents review all changed files  |
| `--follow-up` / `-f` | Follow-up Review | SDE2 always, Architect only if needed |

---

## Full Review Mode (Default)

### Phase 1: Get PR Context

1. **Fetch PR details:**

   ```bash
   gh pr view {pr_number} --json number,title,body,headRefName,baseRefName,author,url,mergedAt
   ```

2. **Extract:**
   - PR title and description
   - Base and head branches
   - Linked GitHub issue (from body `Closes #123` or `Fixes #123`)
   - PR author

3. **If GitHub issue linked, fetch it:**

   ```bash
   gh issue view 123 --json number,title,body,labels,state,url
   ```

   - Understand what was requested
   - Note acceptance criteria

### Phase 2: Read Changed Files & Detect Context

1. **Get list of changed files:**

   ```bash
   gh pr diff {pr_number}
   ```

2. **For each changed file, read full content** using Read tool

3. **Auto-detect context and load rules:**

   | Files Changed        | Rules to Load                                                                                        |
   | -------------------- | ---------------------------------------------------------------------------------------------------- |
   | `packages/core/**`   | [context-engine.md](../rules/context-engine.md), [testing.md](../rules/testing.md)                   |
   | `packages/db/**`     | [context-engine-database.md](../rules/context-engine-database.md), [testing.md](../rules/testing.md) |
   | `packages/server/**` | [context-engine-api.md](../rules/context-engine-api.md), [testing.md](../rules/testing.md)           |
   | `.claude/**`         | Check [Claude Code docs](https://code.claude.com/docs/en/) for latest capabilities                   |
   | Any PR               | [github.md](../rules/github.md)                                                                      |

### Phase 3: Principal Architect Review

**IMPORTANT: You MUST use the Task tool to spawn the Principal Architect agent. Do NOT execute the review yourself.**

```
Task(
  subagent_type: "principal-architect",
  description: "Architecture review for PR",
  prompt: """
  Review PR #{pr_number} from an architectural perspective.

  ## PR Details
  - Title: {pr_title}
  - Description: {pr_description}
  - GitHub Issue: #{issue_number}

  ## Changed Files
  {list of changed files with patches}

  ## Context
  - Loaded rules: {rules loaded based on files changed}
  - Issue requirements: {from GitHub issue if available}

  ## Instructions
  1. Read the pr-review skill at `.claude/skills/pr-review/SKILL.md`
  2. Focus on: system design, scalability, data model, security boundaries
  3. Use Challenge & Propose format for issues
  4. Output review following the skill's format
  5. Return the review body and any inline comments
  """
)
```

### Phase 4: SDE2 Review

**IMPORTANT: You MUST use the Task tool to spawn the SDE2 agent. Do NOT execute the review yourself.**

```
Task(
  subagent_type: "sde2",
  description: "Code quality review for PR",
  prompt: """
  Review PR #{pr_number} for code quality and correctness.

  ## PR Details
  - Title: {pr_title}
  - Description: {pr_description}
  - GitHub Issue: #{issue_number}

  ## Changed Files
  {list of changed files with patches}

  ## Context
  - Loaded rules: {rules loaded based on files changed}
  - Issue requirements: {from GitHub issue if available}

  ## Instructions
  1. Read the pr-review skill at `.claude/skills/pr-review/SKILL.md`
  2. Focus on: type safety, error handling, code structure, testability
  3. Use Challenge & Propose format for issues
  4. Output review following the skill's format
  5. Return the review body and any inline comments
  """
)
```

### Phase 5: Context-Specific Checks

Based on detected context, perform additional checks:

#### If Component files changed:

Review against checklist in [components.md](../rules/components.md)

#### If Token files changed:

Review against checklist in [tokens.md](../rules/tokens.md)

#### If `.claude/**` files changed:

**Check Claude Code Documentation for latest capabilities:**

```
WebFetch(url: "https://code.claude.com/docs/en/", prompt: "What are the current best practices for Claude Code agents, skills, and commands? What capabilities are available?")
```

Review against:

| Aspect                 | What to Check                                           |
| ---------------------- | ------------------------------------------------------- |
| Agent Structure        | Does agent file follow current Claude Code conventions? |
| Skill Format           | Are skills using correct YAML frontmatter format?       |
| Command Structure      | Do commands follow current patterns?                    |
| Available Capabilities | Are we using latest Claude Code features appropriately? |
| Deprecated Patterns    | Are there any deprecated patterns being used?           |

**Documentation sections to check:**

- Agent configuration and best practices
- Skill auto-discovery and invocation
- Command patterns and arguments
- Tool permissions and security
- Any new features or deprecations

### Phase 6: Post Reviews

1. **Post Principal Architect review:**

   ```bash
   gh api repos/nexus-labs/context-engine/pulls/{pr_number}/reviews \
     --method POST \
     --input - <<'EOF'
   {
   "body": "{Principal Architect review from skill}",
   "event": "COMMENT",
   "comments": [
    {"path": "path/to/file", "line": 42, "body": "Issue description"}
   ]
   }
   EOF
   ```

2. **Post SDE2 review:**

   ```bash
   gh api repos/nexus-labs/context-engine/pulls/{pr_number}/reviews \
     --method POST \
     --input - <<'EOF'
   {
   "body": "{SDE2 review from skill}",
   "event": "{APPROVE|COMMENT|REQUEST_CHANGES}",
   "comments": [
    {"path": "path/to/file", "line": 42, "body": "Issue description"}
   ]
   }
   EOF
   ```

   **Verdict logic:**
   | Condition | Event |
   |-----------|-------|
   | No blocking issues in either review | `APPROVE` |
   | Only minor issues (⚠️) | `COMMENT` |
   | Any blocking issues (❌) | `REQUEST_CHANGES` |

---

## Follow-up Review Mode (`--follow-up`)

When developer pushes changes after initial review, use follow-up mode to focus on what changed.

### Agent Selection (Smart)

| Condition                                  | Agents Used      |
| ------------------------------------------ | ---------------- |
| Only code fixes (same files modified)      | SDE2 only        |
| New files added                            | SDE2 + Architect |
| Significant structural changes             | SDE2 + Architect |
| Previous review had architectural concerns | SDE2 + Architect |

### Phase F1: Get PR & Previous Reviews

1. **Fetch PR details** (same as full review)

2. **Fetch previous reviews:**

   ```bash
   gh api repos/nexus-labs/context-engine/pulls/{pr_number}/reviews
   ```

3. **Fetch review comments:**

   ```bash
   gh api repos/nexus-labs/context-engine/pulls/{pr_number}/comments
   ```

4. **Parse previous review data:**
   - Extract issues raised (blocking ❌ and minor ⚠️)
   - Note which files had comments
   - Get timestamp of last review
   - Check if Architect raised architectural concerns

### Phase F2: Identify Changes Since Last Review

1. **Get commits since last review:**

   ```bash
   gh api repos/nexus-labs/context-engine/pulls/{pr_number}/commits
   ```

   - Filter to commits after last review timestamp

2. **Get current changed files:**

   ```bash
   gh pr diff {pr_number}
   ```

3. **Determine if Architect review needed:**
   - Check for new files (not in previous review)
   - Check for significant structural changes (new exports, renamed files)
   - Check if previous Architect review had concerns

4. **Read files that were:**
   - Mentioned in previous review comments
   - Modified in commits since last review

### Phase F3: Verify Previous Issues

For each issue from the previous review:

1. **Read the current state** of the file/line mentioned
2. **Determine status:**

   | Status             | Meaning                           |
   | ------------------ | --------------------------------- |
   | ✅ Fixed           | Issue has been addressed          |
   | ❌ Still Present   | Issue remains unchanged           |
   | ⚠️ Partially Fixed | Attempted but incomplete          |
   | 🔄 Changed         | Code changed, needs re-evaluation |

### Phase F4: Review New Changes

**SDE2 Review (Always):**

**IMPORTANT: You MUST use the Task tool to spawn the SDE2 agent. Do NOT execute the review yourself.**

```
Task(
  subagent_type: "sde2",
  description: "Follow-up review for PR",
  prompt: """
  Follow-up review for PR #{pr_number} after changes.

  ## PR Details
  - Title: {pr_title}
  - Commits since last review: {commit list}

  ## Previous Issues
  {list of issues from previous review with file:line}

  ## Files Modified Since Last Review
  {list of changed files}

  ## Instructions
  1. Read the pr-review-follow-up skill at `.claude/skills/pr-review-follow-up/SKILL.md`
  2. Review ONLY files modified since last review
  3. Check if previous issues are fixed
  4. Look for new issues in the changes
  5. Don't re-review unchanged code
  """
)
```

**Architect Review (If Triggered):**

Only spawn if: new files added, significant structural changes, or previous Architect review had concerns.

```
Task(
  subagent_type: "principal-architect",
  description: "Follow-up architecture review",
  prompt: """
  Follow-up architecture review for PR #{pr_number}.

  ## Why Architect Review Triggered
  {reason: new files / structural changes / previous concerns}

  ## Previous Architectural Concerns
  {list from previous Architect review if any}

  ## New/Changed Files
  {list of new or structurally changed files}

  ## Instructions
  1. Read the pr-review-follow-up skill at `.claude/skills/pr-review-follow-up/SKILL.md`
  2. Review new files for architectural fit
  3. Verify previous architectural concerns addressed
  4. Check structural changes for system impact
  """
)
```

### Phase F5: Post Follow-up Review

```bash
gh api repos/nexus-labs/context-engine/pulls/{pr_number}/reviews \
  --method POST \
  --input - <<'EOF'
{
  "body": "{Follow-up review}",
  "event": "{APPROVE|COMMENT|REQUEST_CHANGES}",
  "comments": [
    {"path": "path/to/file", "line": 42, "body": "New issue or still present"}
  ]
}
EOF
```

**Verdict logic for follow-up:**

| Condition                                            | Event             |
| ---------------------------------------------------- | ----------------- |
| All blocking issues fixed, no new issues             | `APPROVE`         |
| Some issues fixed, only minor remaining              | `COMMENT`         |
| Blocking issues still present OR new blocking issues | `REQUEST_CHANGES` |

---

## Output Formats

### Full Review Output

```markdown
## PR Review — #{pr_number} {title}

**Principal Architect:** {APPROVED|NEEDS DISCUSSION|CHANGES REQUIRED}
**SDE2:** {APPROVED|MINOR CHANGES|CHANGES REQUIRED}

### Issues

| #   | Agent     | Severity    | File         | Issue         |
| --- | --------- | ----------- | ------------ | ------------- |
| 1   | Architect | ❌ Blocking | `file.ts:42` | {description} |
| 2   | SDE2      | ⚠️ Minor    | `file.ts:15` | {description} |

{Omit Issues table entirely if no issues found.}

### Links

- **PR:** {pr_url}
- **GitHub Issue:** {issue_url}
```

### Follow-up Review Output

```markdown
## Follow-up Review — #{pr_number} {title}

**SDE2:** {APPROVED|MINOR CHANGES|CHANGES REQUIRED}
**Architect:** {APPROVED|NEEDS DISCUSSION|CHANGES REQUIRED|⏭️ Skipped}

### Unresolved Issues

| #   | Original Issue | File         | Status           | Notes                |
| --- | -------------- | ------------ | ---------------- | -------------------- |
| 1   | {description}  | `file.ts:42` | ❌ Still Present | {what's still wrong} |
| 2   | {description}  | `file.ts:15` | ⚠️ Partial       | {what's missing}     |

{If all resolved: "All previous issues resolved."}

### New Issues

| #   | Agent | Severity    | File         | Issue         |
| --- | ----- | ----------- | ------------ | ------------- |
| 1   | SDE2  | ❌ Blocking | `file.ts:10` | {description} |

{Omit New Issues table entirely if none.}

### Links

- **PR:** {pr_url}
- **GitHub Issue:** {issue_url}
```

---

## Review Principles

1. **Be objective** - Review as if you didn't write the code
2. **Be specific** - Point to exact lines, suggest fixes
3. **Be constructive** - Explain why, not just what
4. **Prioritize** - Blocking issues vs nice-to-haves
5. **Follow loaded rules** - Rules files are source of truth
6. **Consider context** - Understand the ticket's goals
7. **In follow-up mode** - Focus on changes, don't repeat old feedback
