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

<!-- Describe the high-level structure. Example:
  src/domain/    — pure business logic, no I/O
  src/infra/     — database, external API clients
  src/handlers/  — request handling, input validation
  src/lib/       — shared utilities
-->

<!-- TODO: describe your architecture -->

---

## Domain Language

<!-- Define key terms Claude should use consistently. Example:
  - "User" = authenticated account holder
  - "Member" = user within an organisation
  - "Invoice" = a billable document, not "bill" or "receipt"
-->

<!-- TODO: define domain terms -->

---

## Key Data Models

<!-- Paste or summarise your core types here so Claude has consistent context. -->

<!-- TODO: paste key types here -->

---

## External Integrations

<!-- List APIs, services, and any auth patterns in use. -->

<!-- TODO: list external integrations -->

---

## Conventions & Exceptions

- `commands/` at the repo root is the source of truth for all slash commands. `.claude/commands/` is a deployed copy produced by `init` — never edit files there directly. Changes to commands belong in `commands/` (or `commands/toolkit/` for toolkit-only commands).

---

## What Claude Should Never Touch

<!-- Files or directories that should not be modified without explicit instruction. -->

- `.env` and any secrets files
- `migrations/` — database migrations are written manually
- <!-- TODO: add any other protected paths -->

---

## Security Posture

- **Input trust boundary:** <!-- where does untrusted input enter the system? -->
- **Auth mechanism:** <!-- JWT / session cookie / API key / none -->
- **Secret management:** <!-- env vars / vault / none -->
- Run `/security-review` before merging anything that touches auth, input handling, or external API calls.

---

## Current Context

See `.claude/CONTEXT.md` for current focus, active decisions, and known gotchas.
Read that file at the start of every session before doing anything else.
