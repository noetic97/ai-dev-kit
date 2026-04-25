# Claude Code — Project Steering File

> Extends: ~/.claude/CLAUDE.md (global base)
> Project-level rules override global rules where they conflict.

---

## Project Overview

**Name:** ai-dev-kit
**Description:** Personal Claude Code toolkit — steering files, slash commands, and project scaffolding
**Type:** CLI <!-- e.g. API, CLI tool, full-stack app, library -->

---

## Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict)
- **Framework:** none <!-- e.g. Hono, Next.js, Elysia, none -->
- **Database:** none <!-- e.g. PostgreSQL via Drizzle, SQLite, none -->
- **Testing:** Bun test <!-- e.g. Bun test, Vitest -->
- **Other key dependencies:** TBD

---

## Architecture

```
scripts/         — CLI entry points (init.ts, install-global.ts, update.ts)
scripts/lib/     — pure helpers (checksums, frontmatter parsing)
skills/          — skill source-of-truth (each skill is a directory with SKILL.md + supporting files)
agents/          — subagent definitions (flat .md files)
hooks/           — shell script hooks registered via templates/settings.json
templates/       — file templates consumed by init and install-global
```

---

## Domain Language

- "Skill" = a directory under `skills/` with `SKILL.md` entry point; deployable capability
- "Agent" = a subagent definition under `agents/`; specialist with isolated context and scoped tools
- "Hook" = shell script in `hooks/` registered in `settings.json`; fires on Claude Code lifecycle events
- "Kit" = the ai-dev-kit itself (the repo, not a deployed copy)
- "Deployed artifact" = a file copied to `~/.claude/` or `.claude/` by `install-global` or `init`; gitignored in target projects
- "Source of truth" = the canonical versioned location for skills/agents/hooks/templates (repo root)

---

## Key Data Models

`scripts/lib/checksums.ts` defines `Checksums = Readonly<Record<string, string>>` — maps absolute dest path → SHA256 of content as originally installed. Used to distinguish unmodified kit files (safe to auto-update) from locally modified ones.

---

## External Integrations

None. This is a local CLI tool — no external APIs, services, or network calls.

---

## Conventions & Exceptions

- `skills/` at the repo root is the source of truth for all skills. `agents/` at the repo root is the source of truth for agents. Deploy scripts copy these to `.claude/skills/` and `.claude/agents/` in target projects — never edit deployed copies directly.
- Skills with `scope: global` frontmatter are deployed by `install-global` only, not by `init`. Use this for toolkit-specific skills that don't belong in scaffolded projects.

---

## What Claude Should Never Touch

<!-- Files or directories that should not be modified without explicit instruction. -->

- `.env` and any secrets files
- `migrations/` — database migrations are written manually

---

## Security Posture

- **Input trust boundary:** stdin (prompts) and command-line args in `init.ts` and `install-global.ts`
- **Auth mechanism:** none — local filesystem operations only
- **Secret management:** none — kit never handles secrets
- Run `/security-review` before merging anything that touches file-write logic, especially anything that could write outside the intended directories (`~/.claude/` or `.claude/`).

---

## Current Context

See `.claude/CONTEXT.md` for current focus, active decisions, and known gotchas.
Read that file at the start of every session before doing anything else.
