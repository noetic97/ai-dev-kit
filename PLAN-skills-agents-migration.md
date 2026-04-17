# Plan: Skills & Agents Migration

> Add this file to your ai-dev-kit repo and reference it from `.claude/CONTEXT.md`.
> Work through phases in order. Check items off as you go.
> Each phase is a standalone commit — don't batch them.

---

## Background

Claude Code has merged `commands/` into a richer `skills/` system. The key upgrades:
- Skills live in directories (not flat `.md` files), enabling **supporting files** alongside the main instructions
- Frontmatter controls invocation mode, allowed tools, and model routing
- `context: fork` runs a skill in an isolated subagent with a clean context window
- `.claude/agents/` defines persistent specialist subagents with their own system prompts and scoped tool access

This plan migrates the existing `commands/` setup to take full advantage of these primitives, adds a formal agents layer, introduces hooks, and updates the deploy scripts to handle the new structure.

---

## Phase 1 — Quick Wins (no structural changes)

> These are frontmatter additions to existing command files. No refactoring required.
> Highest ROI per minute of work.

### 1.1 Add `context: fork` to `adversarial-review`

The adversarial review is supposed to have "fresh eyes" but currently runs in the main conversation context — it can see everything you've done this session. `context: fork` gives it actual isolation.

**File:** `commands/adversarial-review.md`

Add to the top:
```yaml
---
name: adversarial-review
description: Adversarial re-review of code just written. Skeptical senior engineer who did not write this code. Use after any implementation to find holes before committing.
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob, Bash
---
```

- [x] Add frontmatter to `commands/adversarial-review.md`
- [ ] Test: run `/adversarial-review` and confirm it runs in a forked context (you'll see a subagent indicator in the UI)
- [x] Commit: `feat: fork adversarial-review into isolated Explore subagent`

### 1.2 Add frontmatter to remaining commands

Add `name`, `description`, and `allowed-tools` to all commands. This enables auto-discovery (Claude loads the skill when relevant without explicit invocation) and enforces tool scoping.

Priority order and suggested frontmatter:

**`code-review.md`**
```yaml
---
name: code-review
description: Thorough code review on specified files or current diff. Use when reviewing changes before commit or when asked to review code quality.
allowed-tools: Read, Grep, Glob, Bash
---
```

**`security-review.md`**
```yaml
---
name: security-review
description: Security-focused review — input validation, secrets, injection, auth. Run before merging anything touching auth or external APIs.
allowed-tools: Read, Grep, Glob, Bash
---
```

**`commit.md`**
```yaml
---
name: commit
description: Stage files and commit with a conventional commit message. Use when ready to commit current changes.
allowed-tools: Read, Bash
model: sonnet
---
```

**`pr-description.md`**
```yaml
---
name: pr-description
description: Generate PR title and description from the current changeset. Use when preparing a pull request.
allowed-tools: Read, Bash
model: sonnet
---
```

**`update-context.md`**
```yaml
---
name: update-context
description: Refresh .claude/CONTEXT.md with current project state. Use at the end of a session or when focus shifts.
allowed-tools: Read, Write, Bash
model: sonnet
---
```

**`changelog.md`**
```yaml
---
name: changelog
description: Generate a CHANGELOG entry from recent git history. Use when preparing a release or summarizing recent work.
allowed-tools: Read, Bash
model: sonnet
---
```

**`adr.md`**
```yaml
---
name: adr
description: Create an Architecture Decision Record for a technical decision. Use when making or documenting a significant architectural choice.
allowed-tools: Read, Write, Bash
model: sonnet
---
```

**`bug-hunter.md`**
```yaml
---
name: bug-hunter
description: Systematic bug investigation — instrument first, fix with evidence. Use when debugging a problem that isn't immediately obvious.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---
```

**`new-feature.md`**
```yaml
---
name: new-feature
description: Spec-driven feature implementation. Discover → spec → implement. Use when starting a new feature from scratch.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---
```

**`new-module.md`**
```yaml
---
name: new-module
description: Scaffold a new TypeScript module following project conventions. Use when creating a new module with types, logic, and tests.
allowed-tools: Read, Write, Edit, Bash
---
```

**`review-fix.md`** and **`review-fix-auto.md`**
```yaml
---
name: review-fix
description: Work through review findings interactively, one fix at a time. Use after code-review or adversarial-review to implement findings manually.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---
```

**`full-review.md`**
```yaml
---
name: full-review
description: Complete review cycle — code review then adversarial review with autonomous fix loops between each stage. Use before merging significant changes.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---
```

**`implement-and-ship.md`**
```yaml
---
name: implement-and-ship
description: Full flow from module scaffolding to committed PR — scaffold, review, fix, commit. Use when building and shipping a new module end-to-end.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---
```

- [ ] Add frontmatter to all commands listed above
- [ ] Note: model routing — `sonnet` for lightweight commands (commit, pr-description, changelog, update-context, adr), default (Opus) for review and implementation commands
- [ ] Commit: `feat: add skill frontmatter to all commands`

---

## Phase 2 — Agents Layer

> Create `.claude/agents/` with specialist subagents. These become reusable across all projects via `install-global`.

### 2.1 Create adversarial-reviewer agent

This is the formal subagent definition that `adversarial-review` skill delegates to. Enforces read-only tool access at the agent level — not just in the prompt.

**File:** `.claude/agents/adversarial-reviewer.md`
```markdown
---
name: adversarial-reviewer
description: Skeptical senior engineer who did not write the code under review. Invoked by adversarial-review skill. Read-only access — cannot write fixes, only find problems.
tools: Read, Grep, Glob, Bash
model: opus
---

You are a senior engineer performing an adversarial review. You did not write this code.

Your job is to find what's wrong — not to validate, encourage, or be balanced. Find the holes.

Focus on:
- Edge cases the author missed (boundaries, nulls, concurrency, dependency failures)
- Architectural shortcuts that will cause pain later
- Logic errors that pass the happy path but fail in production
- Test gaps — failure modes with no coverage
- Security holes — implicit trust, injection vectors, unvalidated input

Output format:
- **Critical** — data loss, security breach, silent incorrect behavior. Block merge.
- **Should Fix** — real problem worth addressing before merge.
- **Consider** — architectural debt. Belongs in backlog, not this PR.
- **Test Gaps** — what is uncovered and should be.
- **If I had to break this** — one concrete production failure scenario.

Rules:
- Do not suggest fixes unless the fix is one line and obvious. Finding holes is the job.
- If you find nothing serious, say so plainly — but look hard first.
- Tone: rigorous, direct, no padding.
```

- [ ] Create `.claude/agents/` directory
- [ ] Create `.claude/agents/adversarial-reviewer.md`
- [ ] Commit: `feat: add adversarial-reviewer subagent`

### 2.2 Create diff-explorer agent

A read-only agent that maps what changed and why before a review starts. Used by `full-review` to generate a changeset summary without polluting the main context.

**File:** `.claude/agents/diff-explorer.md`
```markdown
---
name: diff-explorer
description: Maps a git diff — what changed, why, and what risk areas to focus on. Invoked by full-review before handing off to reviewers. Read-only.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a diff analyst. Your job is to read a changeset and produce a structured map of what changed.

When invoked, run:
- `git diff` or `git diff <base>` to get the changeset
- `git log --oneline -10` for recent commit context

Produce:
1. **Changeset summary** — what this change does in one paragraph, plain language
2. **Files changed** — flat list with one-line annotation per file (added/modified/deleted + what changed)
3. **Risk areas** — which parts of the diff warrant closest scrutiny and why
4. **Dependencies touched** — any package.json, lock file, or import changes
5. **Test coverage** — are the changed code paths covered by tests in the diff?

Keep it factual. No opinions on quality — that's the reviewer's job.
Return your structured map as the final output.
```

- [ ] Create `.claude/agents/diff-explorer.md`
- [ ] Commit: `feat: add diff-explorer subagent`

### 2.3 Create security-auditor agent

A reusable security-focused agent that can be invoked from `security-review` or independently.

**File:** `.claude/agents/security-auditor.md`
```markdown
---
name: security-auditor
description: Security-focused code reviewer. OWASP lens. Invoked by security-review skill or explicitly for auth/API/input handling changes. Read-only.
tools: Read, Grep, Glob, Bash
model: opus
---

You are a senior application security engineer performing a security audit. You think like an attacker but communicate like a consultant.

Focus areas:
- Input validation at every trust boundary
- Secrets exposure (hardcoded, logged, serialized to responses)
- Injection vectors: SQL, shell, path traversal, prompt injection
- Auth and authorization: missing checks, IDOR risks, privilege escalation
- Dependency risk: new packages, pinning, native bindings, network access
- Error handling: information disclosure in error responses

Output format:
- **Must Fix** — exploitable issues or high-confidence vulnerabilities (blocking)
- **Should Fix** — likely risks worth addressing before shipping
- **Consider** — defence-in-depth suggestions
- **Looks Good** — security properties handled correctly (always include)

Be specific — reference exact lines, function names, or data flows.
Distinguish between theoretical risk and realistic exploitability.
If a finding only applies under specific deployment assumptions, state them.
```

- [ ] Create `.claude/agents/security-auditor.md`
- [ ] Commit: `feat: add security-auditor subagent`

### 2.4 Update `full-review` to use agents explicitly

Update `full-review.md` to delegate each phase to the appropriate subagent rather than running everything in main context.

Key changes:
- Step 1 (preflight): use `diff-explorer` to map the changeset
- Step 3 (adversarial): explicitly invoke `adversarial-reviewer` subagent
- Main context handles only the fix loops (needs Write access)

- [ ] Update `commands/full-review.md` to reference `diff-explorer` and `adversarial-reviewer` agents
- [ ] Commit: `refactor: wire full-review to use diff-explorer and adversarial-reviewer agents`

---

## Phase 3 — Skills Directory Structure

> Migrate from flat `commands/*.md` to `skills/<name>/SKILL.md` with supporting files.
> Do one skill at a time. Each migration is its own commit.

### 3.1 Migrate `code-review`

Extract the review rubric into a supporting file.

```
commands/skills/code-review/
  SKILL.md           ← frontmatter + invocation rules + output format
  review-rubric.md   ← the 6 criteria (correctness, FP, TS, tests, readability, architecture)
```

- [ ] Create `commands/skills/code-review/` directory
- [ ] Extract criteria into `review-rubric.md`
- [ ] Write lean `SKILL.md` that references `review-rubric.md`
- [ ] Delete `commands/code-review.md`
- [ ] Commit: `refactor: migrate code-review to skills directory structure`

### 3.2 Migrate `adversarial-review`

```
commands/skills/adversarial-review/
  SKILL.md             ← frontmatter (context: fork, agent: adversarial-reviewer) + invocation rules
  attack-vectors.md    ← the what-to-look-for checklist (edge cases, architecture, logic, tests, security)
```

- [ ] Create `commands/skills/adversarial-review/`
- [ ] Extract attack vectors into `attack-vectors.md`
- [ ] Write `SKILL.md` with `context: fork`, `agent: adversarial-reviewer`
- [ ] Delete `commands/adversarial-review.md`
- [ ] Commit: `refactor: migrate adversarial-review to skills directory`

### 3.3 Migrate `new-module`

```
commands/skills/new-module/
  SKILL.md              ← prompts, rules
  module-structure.md   ← the output structure template (index.ts, types.ts, etc.)
```

- [ ] Migrate `new-module`
- [ ] Commit: `refactor: migrate new-module to skills directory`

### 3.4 Migrate `pr-description`

```
commands/skills/pr-description/
  SKILL.md          ← instructions, git detection logic
  pr-template.md    ← the output format spec (title, summary, changed files, test plan)
```

- [ ] Migrate `pr-description`
- [ ] Commit: `refactor: migrate pr-description to skills directory`

### 3.5 Migrate remaining commands

Migrate the rest individually:

- [ ] `new-feature` → extract spec template into `spec-template.md`
- [ ] `bug-hunter` → extract phase checklist into `debug-phases.md`
- [ ] `security-review` → extract OWASP checklist into `security-checklist.md`
- [ ] `full-review`, `review-fix`, `review-fix-auto`, `implement-and-ship` (lean, no supporting files needed)
- [ ] `commit`, `changelog`, `adr`, `update-context` (lean, no supporting files needed)
- [ ] Commit each migration separately

### 3.6 Update deploy path convention

After all migrations, update `CLAUDE.md` conventions comment:

```
# Before
commands/ at the repo root is the source of truth. `.claude/commands/` is the deployed copy.

# After
commands/skills/ is the source of truth for skills. .claude/agents/ is the source of truth for agents.
`.claude/skills/` and `.claude/agents/` are deployed copies — never edit there directly.
```

- [ ] Update `CLAUDE.md` conventions section
- [ ] Update `README.md` table to reflect new structure
- [ ] Commit: `docs: update conventions for skills directory structure`

---

## Phase 4 — Hooks

> Hooks fire on Claude Code lifecycle events. Two hooks that directly close gaps in the current workflow.

### 4.1 Test-on-write hook

Runs `bun test` after any `Write` or `Edit` tool call. Surfaces test failures before the next step in a review loop rather than silently accumulating them.

**File:** `.claude/hooks/post-write-test.sh`
```bash
#!/bin/bash
# Post-tool-use hook: run tests after Write/Edit
# Only runs if bun test is available and there are test files
if command -v bun &> /dev/null && find . -name "*.test.ts" | grep -q .; then
  echo "[hook] Running tests after file write..."
  bun test --bail 2>&1 | tail -20
fi
```

**`.claude/settings.json`** (add hook registration):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": ".claude/hooks/post-write-test.sh" }]
      }
    ]
  }
}
```

- [ ] Create `.claude/hooks/` directory
- [ ] Create `.claude/hooks/post-write-test.sh` and make it executable (`chmod +x`)
- [ ] Create or update `.claude/settings.json` with hook registration
- [ ] Test: make a change and confirm tests run automatically
- [ ] Commit: `feat: add post-write test hook`

### 4.2 Context-update reminder hook

Nudges you to run `/update-context` when a session ends. Fires on the `Stop` event.

**File:** `.claude/hooks/session-end-reminder.sh`
```bash
#!/bin/bash
# Stop hook: remind user to update context
echo ""
echo "─────────────────────────────────────────"
echo "  Session ending. If focus shifted or"
echo "  decisions were made, run /update-context"
echo "─────────────────────────────────────────"
echo ""
```

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": ".claude/hooks/session-end-reminder.sh" }]
      }
    ]
  }
}
```

- [ ] Create `.claude/hooks/session-end-reminder.sh` and make it executable
- [ ] Add `Stop` hook to `.claude/settings.json`
- [ ] Commit: `feat: add session-end context reminder hook`

---

## Phase 5 — Deploy Script Updates

> Update `scripts/install-global.ts` and `scripts/init.ts` to handle the new skills directory structure.

### 5.1 Update `install-global.ts`

Current behavior: copies flat `.md` files from `commands/` to `~/.claude/commands/`.

New behavior: copies skill directories from `commands/skills/` to `~/.claude/skills/`, and agents from `.claude/agents/` to `~/.claude/agents/`.

Key changes to `installCommandsFromDir`:

```typescript
// Current: copies file → ~/.claude/commands/file.md
// New: copies directory → ~/.claude/skills/skill-name/ (with all files inside)

const installSkillsFromDir = (srcDir: string, destDir: string): InstallResult[] => {
  // Read skill directories (not flat .md files)
  // For each directory, copy SKILL.md + all supporting files
  // Maintain checksum per file within each skill directory
}

const installAgents = (): InstallResult[] => {
  // Copy .claude/agents/*.md to ~/.claude/agents/
}
```

Checksum tracking: extend to track individual files within skill directories. Key format: `~/.claude/skills/code-review/SKILL.md`, `~/.claude/skills/code-review/review-rubric.md`, etc.

- [ ] Write plan for `install-global.ts` changes (plan first, per CLAUDE.md)
- [ ] Update `installCommandsFromDir` → `installSkillsFromDir` to handle directories
- [ ] Add `installAgents` function
- [ ] Update checksum tracking for per-file granularity within skill directories
- [ ] Update `main()` to call new functions
- [ ] Test: run `bun run install-global` and verify `~/.claude/skills/` and `~/.claude/agents/` are populated
- [ ] Commit: `feat: update install-global to deploy skills directories and agents`

### 5.2 Update `init.ts`

Current behavior: copies flat `.md` files from `commands/` to `.claude/commands/`.

New behavior: copies skill directories to `.claude/skills/`, creates `.claude/agents/` directory.

- [ ] Update `scaffoldCommands` → `scaffoldSkills` to copy skill directories
- [ ] Add `scaffoldAgents` to create `.claude/agents/` and copy relevant agents
- [ ] Update `printResult` output to reflect new paths
- [ ] Test: run `ai-init` in a test project and verify structure
- [ ] Commit: `feat: update init to scaffold skills directories`

### 5.3 Update `update.ts`

Extend conflict detection to handle skill directories:

- [ ] Update `updateFilesFromDir` to recurse into skill directories
- [ ] Ensure stale skill detection works (skills removed from source are flagged)
- [ ] Commit: `feat: update update.ts for skills directory structure`

### 5.4 Fix CLAUDE.md sentinel marker

Current marker `"Claude Code — Global Steering File"` is fragile — title change silently duplicates on reinstall.

Replace with a unique sentinel comment in the file header:

```markdown
<!-- ai-dev-kit:global:v1 -->
# Claude Code — Global Steering File
```

Update `appendIfMissing` marker in `install-global.ts`:
```typescript
// Before
appendIfMissing(dest, content, "Claude Code — Global Steering File")
// After
appendIfMissing(dest, content, "ai-dev-kit:global:")
```

- [ ] Add sentinel comment to `CLAUDE.md` and `templates/global-claude-example.md`
- [ ] Update marker string in `install-global.ts` and `update.ts`
- [ ] Commit: `fix: use stable sentinel marker for CLAUDE.md duplicate detection`

---

## Phase 6 — Close Backlog Items

> Items in BACKLOG.md that are now unblocked by the phases above.

### 6.1 Close: `scripts/review-agent.ts`

The backlog item "true multi-agent: spawn a second claude CLI session as a reviewer" is now implemented via `context: fork` + `adversarial-reviewer` agent. This is exactly what that item was asking for.

- [ ] Mark `scripts/review-agent.ts` backlog item as complete in `BACKLOG.md`
- [ ] Add note: "Implemented via adversarial-review skill + adversarial-reviewer agent (context: fork)"
- [ ] Commit: `docs: close review-agent backlog item — implemented via skills/agents`

### 6.2 `select()` NaN fallback

Non-numeric input silently falls to option 1. Should validate and re-prompt.

- [ ] Fix `select()` in `scripts/init.ts` to validate input and re-prompt on non-numeric
- [ ] Commit: `fix: validate select() input and re-prompt on non-numeric entry`

### 6.3 Stale commands cleanup

When a skill is deleted from the kit, deployed copies aren't removed. Add tracking.

- [ ] Extend `.kit-checksums` metadata to track which files were kit-deployed
- [ ] Add removal logic to `update.ts` for files no longer in source
- [ ] Commit: `feat: remove stale deployed skills on update`

---

## Maintenance Notes

**Skill description budget:** Claude loads all skill names but truncates descriptions past ~1536 chars. Front-load the key use case in each description. If a skill isn't auto-triggering when expected, the description may be getting cut.

**Agent scope:** Project agents (`.claude/agents/`) are committed to the repo and shared. Personal agents (`~/.claude/agents/`) are for individual preferences. The kit's agents go in `.claude/agents/` since they're workflow tools, not personal style preferences.

**Model routing:** `model: sonnet` on lightweight commands (commit, pr, changelog, adr, update-context) vs default on reasoning-heavy ones (full-review, adversarial-review, new-feature). Revisit if cost becomes a concern.

**Testing hooks:** The `post-write-test.sh` hook will fire on every write including init and scaffolding. If this is too noisy in non-test contexts, add a guard: only run if a `package.json` with a `test` script exists in the current directory.
