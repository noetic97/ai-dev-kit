# Claude Code — Project Steering File

> Extends: ~/.claude/CLAUDE.md (global base)
> Project-level rules override global rules where they conflict.

---

## Project Overview

**Name:** {{PROJECT_NAME}}
**Description:** {{PROJECT_DESCRIPTION}}
**Type:** {{PROJECT_TYPE}} <!-- e.g. API, CLI tool, full-stack app, library -->

---

## Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict)
- **Frontend:** {{FRONTEND_FRAMEWORK}}
- **Backend:** {{BACKEND_FRAMEWORK}}
- **Database:** {{DATABASE}} <!-- e.g. PostgreSQL via Drizzle, SQLite, none -->
- **Testing:** {{TEST_FRAMEWORK}} <!-- e.g. Bun test, Vitest -->
- **Other key dependencies:** {{OTHER_DEPS}}

---

## Architecture

<!-- Describe the high-level structure. Example:
  src/domain/    — pure business logic, no I/O
  src/infra/     — database, external API clients
  src/handlers/  — request handling, input validation
  src/lib/       — shared utilities
-->

{{ARCHITECTURE_DESCRIPTION}}

---

## Domain Language

<!-- Define key terms Claude should use consistently. Example:
  - "User" = authenticated account holder
  - "Member" = user within an organisation
  - "Invoice" = a billable document, not "bill" or "receipt"
-->

{{DOMAIN_GLOSSARY}}

---

## Key Data Models

<!-- Paste or summarise your core types here so Claude has consistent context. -->

{{KEY_TYPES}}

---

## External Integrations

<!-- List APIs, services, and any auth patterns in use. -->

{{INTEGRATIONS}}

---

## Conventions & Exceptions

<!-- Any project-specific deviations from the global CLAUDE.md.
  Example: "This project uses classes for database models due to the ORM." -->

{{PROJECT_CONVENTIONS}}

---

## What Claude Should Never Touch

<!-- Files or directories that should not be modified without explicit instruction. -->

- `.env` and any secrets files
- `migrations/` — database migrations are written manually
- {{OTHER_OFF_LIMITS}}

## AI Session Discipline

- Don't batch unrelated concerns into a single session. Review and fix loops (`/full-review`, `/review-implementer`) degrade in quality proportionally with diff size. Keep changes focused to one logical concern per session — prefer small, reviewable commits over large sweeping changes.

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
