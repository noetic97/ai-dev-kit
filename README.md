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

## Setup (one time)

Copy the global base to your Claude home directory:

```bash
cp CLAUDE.md ~/.claude/CLAUDE.md
```

## Usage

Run the init script from any new project directory:

```bash
# From the project root
bun <path-to-this-repo>/scripts/init.ts

# Or if you add a shell alias (recommended):
# alias ai-init="bun ~/repos/ai-dev-kit/scripts/init.ts"
ai-init
```

The script will:
1. Ask a few questions about the project
2. Create `.claude/CLAUDE.md` pre-filled with your answers
3. Copy slash commands into `.claude/commands/`
4. Create `.claudeignore`
5. Merge into existing files rather than overwrite

## Slash commands

Once scaffolded into a project, use these in any Claude Code session:

| Command | Purpose |
|---|---|
| `/new-module` | Scaffold a new TypeScript module with types, logic, and tests |
| `/adr` | Create an Architecture Decision Record |
| `/code-review` | Review current git diff against project conventions |

## Extending for a project

Edit `.claude/CLAUDE.md` in the project to:
- Fill in the TODO placeholders
- Override any global rules that don't apply
- Add domain-specific context, key types, and integration details
- Update `## Current Focus` as work progresses

## Adding new commands

Drop a `.md` file into `.claude/commands/` in any project, or add it here to make it available globally via the init script.
