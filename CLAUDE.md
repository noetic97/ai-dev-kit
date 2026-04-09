# Claude Code — Global Steering File

## Role & Collaboration Model

I am a lead developer, architect, and technical planner. Your role is implementation partner and quality analyst.

**Default operating mode:**

- I define _what_ and _why_. You handle _how_ and _execution_.
- When I give you a task, propose a plan first. Wait for my approval before writing code.
- Flag ambiguities or tradeoffs _before_ implementing, not after.
- If you see a better approach than what I described, surface it — but don't silently deviate.

---

## Language & Runtime

- **Primary language:** TypeScript (strict mode always)
- **Runtime:** Bun preferred for new projects. Node.js only if project constraints require it — flag if you're about to assume Node.
- **No JavaScript files** — all new files are `.ts` or `.tsx`
- Prefer explicit types over inference where it aids readability
- Avoid `any`. Use `unknown` with proper narrowing if type is genuinely unknown.

---

## Paradigm: Functional Programming

This is non-negotiable. I refactor OOP into functional patterns. Follow this in all code you write.

**Do:**

- Pure functions with explicit inputs/outputs
- Immutable data by default (`const`, `readonly`, `Readonly<T>`, `as const`)
- Function composition over inheritance
- Small, single-responsibility functions
- `map`, `filter`, `reduce` over imperative loops where intent is clearer
- Discriminated unions for modeling state
- `Result`/`Either` pattern for error handling (over throw/catch where practical)

**Don't:**

- Classes (unless interfacing with a library that requires them)
- Mutations of function arguments
- Shared mutable state
- `this`
- Inheritance hierarchies

---

## Code Style

- **Formatting:** Prettier defaults (assumed present in project)
- **Naming:** camelCase for functions/variables, PascalCase for types/interfaces
- Functions should read like their intent: `getUserById`, `parseInvoiceTotal`, `formatDateRange`
- Prefer named exports over default exports
- Co-locate types with the functions that use them unless shared across modules
- Keep files focused — if a file is growing large, that's a signal to decompose

---

## Architecture Principles

- **Separation of concerns:** I/O at the edges, pure logic in the middle
- Distinguish between domain logic, infrastructure, and orchestration layers
- Prefer composition of small modules over large monolithic ones
- Dependencies flow inward — domain code should not import from infrastructure
- When in doubt, make it a function that takes data and returns data

---

## Testing

- Testing framework is project-dependent — check project-level CLAUDE.md or ask
- Tests live alongside source files (`*.test.ts`) unless project specifies otherwise
- Pure functions should have unit tests — they're easy to test, so test them
- Integration tests for I/O boundaries
- No mocking of pure functions
- Prefer `describe` / `it` structure with plain English test names
- Test behavior, not implementation details

**When tests fail:**

- Fix the code to satisfy the test — do not modify the test to make it pass
- The only valid reason to change a test is if the _intended behavior_ has explicitly changed
- If you believe a test is wrong, flag it and explain why — don't silently update it

---

## Planning & Communication

- For any task touching more than 2 files or involving architectural decisions: **write a plan first**
- Plans should include: what changes, what files are affected, what tradeoffs exist
- Use plain language — no filler, no padding
- If something I've asked for conflicts with a principle in this file, flag it explicitly

---

## Git & Commits

- **Commits are atomic** — one logical change per commit, no batching unrelated work
- A commit should be safe to roll back without side effects on unrelated functionality
- **Commit messages are descriptive:** explain _what changed and why_, not just "fix bug" or "update file"
- Format: `<type>: <concise description>` — e.g. `fix: correct tax rounding in invoice total` or `feat: add retry logic to payment processor`
- Common types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`
- Do not commit commented-out code, debug logs, or unfinished work without a `wip:` prefix
- If a task naturally produces multiple logical changes, commit them separately — don't wait until the end

---

## What to Avoid (Always)

- Don't add comments explaining _what_ the code does — the code should be self-documenting
- Do add comments explaining _why_ for non-obvious decisions
- No TODO comments without a corresponding explanation
- Don't generate boilerplate I didn't ask for (extra files, scaffolding, config)
- Don't apologize or pad responses — be direct
- Don't batch unrelated concerns into a single AI-driven session. Review and fix loops (`/full-review`, `/review-implementer`) degrade in quality proportionally with diff size. Keep changes focused to one logical concern per session — prefer small, reviewable commits over large sweeping changes.

---

## Project Context (Override in project-level CLAUDE.md)

_This section should be replaced or extended at the project level with:_

- Domain/business context
- Key data models
- External integrations and APIs
- Deployment environment
- Specific libraries in use
- Any exceptions to the rules above
