# Backlog

Longer-term items not yet scheduled. Update as work is completed or priorities shift.
Immediate next actions live in `.claude/CONTEXT.md` → Next Up.

---

## Infrastructure

- **`scripts/update.ts`** — propagate kit changes to existing projects. Strategy: checksum-compare kit's known version vs. installed file; only overwrite if unmodified. Needed before Verdaccio publish.
- **Init idempotency** — skip prompts for fields already answered on re-runs (read existing `.claude/CLAUDE.md` and pre-fill answers). Useful when re-running init to pick up new commands.
- **Deploy a quickstart alongside commands** — when `init` runs on a new project, include a brief how-to (slash command usage, suggested first prompt, link to kit README).

## Packaging

- **Verdaccio publish** — self-hosted package registry. Prerequisites: update.ts exists, at least one real project has used the full command set end-to-end, package.json exports and bin entries defined.
- **NPM publish** — after Verdaccio is stable and toolkit is proven.

## Commands

- **`/commit` warn on main** — add a check before staging: if current branch is `main`, warn and require explicit confirmation before proceeding. Prevents accidentally committing directly to main.
- **`gh pr create` integration in `/pr-description`** — after generating the description, offer to run `gh pr create` directly with the generated title and body. Requires `gh` CLI installed and authenticated.

- **`commands/implement-with-review.md`** (alias for implement-and-ship) — evaluate after POC whether a lighter-weight variant is needed.
- **`scripts/review-agent.ts`** — true multi-agent: spawn a second `claude` CLI session as a reviewer, pipe diff to it, return structured output. Defer until single-session review patterns are validated.
- **Fix B: framework-aware template injection** — when init detects a known framework (e.g. Preact), auto-inject framework-specific notes into `.claude/CLAUDE.md` (e.g. "use `preact/hooks`, not `react`").

## Quality

- **Tests for `scripts/init.ts` and `scripts/install-global.ts`** — especially `appendIfMissing`, `select`, `installCommandsFromDir`, and the conditional FE/BE branching. Required before v1.0.
- **iTerm2 / CSI u note in README** — document the shift+enter keybinding requirement for users who want newline-in-chat.
