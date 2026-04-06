# ai-dev-kit

Personal Claude Code toolkit. Steering files, slash commands, and project scaffolding for TypeScript/Bun projects.

## What's inside

```
CLAUDE.md                    ← global base steering file → copy to ~/.claude/CLAUDE.md
templates/
  project-claude.md          ← project-level CLAUDE.md template (filled by init script)
  claudeignore               ← base .claudeignore
commands/
  new-module.md              ← /new-module  scaffold a new TS module
  adr.md                     ← /adr         create an Architecture Decision Record
  code-review.md             ← /code-review review current changes
scripts/
  init.ts                    ← scaffolds a new project interactively
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

Once scaffolded into a project, use these in any Claude Code session:

| Command | Purpose |
|---|---|
| `/new-module` | Scaffold a new TypeScript module with types, logic, and tests |
| `/adr` | Create an Architecture Decision Record |
| `/code-review` | Review current git diff against project conventions |
| `/security-review` | Security-focused review — input validation, secrets, injection, auth |
| `/adversarial-review` | Adversarial re-review of code you just wrote — find the holes |
| `/pr-description` | Generate a PR title and description from the full changeset |

## Extending for a project

Edit `.claude/CLAUDE.md` in the project to:
- Fill in the TODO placeholders
- Override any global rules that don't apply
- Add domain-specific context, key types, and integration details
- Update `## Current Focus` as work progresses

## Adding new commands

Drop a `.md` file into `.claude/commands/` in any project, or add it here to make it available globally via the init script.
