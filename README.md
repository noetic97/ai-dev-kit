# ai-dev-kit

Personal Claude Code toolkit. Steering files, slash commands, and project scaffolding for TypeScript/Bun projects.

## What's inside

```
CLAUDE.md                    ← global base steering file → deployed to ~/.claude/CLAUDE.md
templates/
  project-claude.md          ← project-level CLAUDE.md template (filled by init)
  context.md                 ← CONTEXT.md template (living session context)
  claudeignore               ← base .claudeignore
commands/
  *.md                       ← slash commands (deployed to projects via init)
  toolkit/
    *.md                     ← toolkit-only commands (deployed to ~/.claude only)
scripts/
  init.ts                    ← scaffolds a new project interactively
  install-global.ts          ← deploys CLAUDE.md + commands to ~/.claude/
```

## Quick start

### 1. One-time global setup

Deploy the global steering file and commands to `~/.claude/`:

```bash
cd ~/path/to/ai-dev-kit
bun run install-global
```

Add a shell alias so you can run `init` from any directory (recommended):

```bash
# ~/.zshrc or ~/.bashrc
alias ai-init="bun ~/path/to/ai-dev-kit/scripts/init.ts"
```

### 2. Start a new project

```bash
mkdir my-project && cd my-project
bun init                # initialise Bun project
ai-init                 # scaffold Claude steering files
```

The init script will prompt you to choose:
- **Project type** — API / CLI / Frontend / Full-stack / Library
- **Frontend framework** — React / Preact / Vue / Svelte / None *(full-stack & frontend only)*
- **Backend framework** — Hono / Elysia / Express / None *(full-stack & API only)*
- **Database** — PostgreSQL / SQLite / MySQL / None
- **Test framework** — Bun test / Vitest / Jest / None

Each prompt offers an **Other** option for free-text entry.

It will create:
```
.claude/
  CLAUDE.md       ← project steering file (pre-filled from your answers)
  CONTEXT.md      ← living session context (never overwritten by re-runs)
  commands/       ← slash commands copied from the kit
.claudeignore
```

Files are never overwritten — re-running `ai-init` is always safe.

### 3. Open a Claude session

```bash
claude
```

Suggested first prompt:

> "Read `.claude/CLAUDE.md` and `.claude/CONTEXT.md` to orient yourself, then let's get started."

### 4. Fill in the TODOs

After init, open `.claude/CLAUDE.md` and fill in the placeholder sections:
- Architecture description
- Domain language / glossary
- Key data models
- External integrations
- Security posture

Update `.claude/CONTEXT.md` with your current focus before each session.

## Slash commands

Slash commands are typed inside a **Claude Code chat session** — not in the terminal.

```bash
# Start a session first
claude

# Then type a command in the chat input
/code-review
```

Commands available after running `ai-init` in a project (`/` to see them in the chat input):

| Command | Purpose |
|---|---|
| `/new-module` | Scaffold a new TypeScript module with types, logic, and tests |
| `/adr` | Create an Architecture Decision Record |
| `/code-review` | Thorough code review on specified files or the current diff |
| `/security-review` | Security-focused review — input validation, secrets, injection, auth |
| `/adversarial-review` | Adversarial re-review of code you just wrote — find the holes |
| `/pr-description` | Generate a PR title and description from the full changeset |
| `/new-feature` | Spec-driven feature implementation — discovery, spec approval, then build |
| `/bug-hunter` | Systematic bug investigation — instrument first, fix with log evidence |
| `/implement-and-ship` | Orchestrate the full flow: scaffold → review → fix → commit |
| `/commit` | Stage files and commit with a conventional commit message |
| `/update-context` | Refresh `.claude/CONTEXT.md` with current project state |
| `/changelog` | Generate a CHANGELOG entry from recent git history |
| `/review-fix` | Work through review findings interactively, one fix at a time (manual mode) |
| `/review-fix-auto` | Autonomously implement review findings, re-run the review, and loop until clean (max 3 passes) |
| `/full-review` | Complete review-and-fix cycle: code review → fix loop → adversarial review → fix loop |

### Toolkit-only commands

These are deployed to `~/.claude/commands/` by `install-global` but are **not** copied to projects by `init` — they are specific to working in this repo.

| Command | Purpose |
|---|---|
| `/sync-docs` | Verify the README slash commands table matches the actual commands in `commands/` |

## Extending for a project

Edit `.claude/CLAUDE.md` in the project to:
- Fill in the TODO placeholders
- Override any global rules that don't apply
- Add domain-specific context, key types, and integration details
- Update `## Current Focus` as work progresses

## Adding new commands

Drop a `.md` file into `.claude/commands/` in any project, or add it here to make it available globally via the init script.
