# Backlog

Longer-term items not yet scheduled. Update as work is completed or priorities shift.
Immediate next actions live in `.claude/CONTEXT.md` → Next Up.

---

## Infrastructure

- **Deploy a quickstart alongside commands** — when `init` runs on a new project, include a brief how-to (slash command usage, suggested first prompt, link to kit README).

## Packaging

- **Verdaccio publish** — self-hosted package registry. Prerequisites: update.ts exists, at least one real project has used the full command set end-to-end, package.json exports and bin entries defined.
- **NPM publish** — after Verdaccio is stable and toolkit is proven.

## Commands

- ~~**`scripts/review-agent.ts`**~~ — **Done.** Implemented via `adversarial-review` skill (`context: fork`) + `adversarial-reviewer` agent. Forked subagent gets a clean context and read-only tool access — exactly what this item was asking for.
- **Fix B: framework-aware template injection** — when init detects a known framework (e.g. Preact), auto-inject framework-specific notes into `.claude/CLAUDE.md` (e.g. "use `preact/hooks`, not `react`").
- **`gh pr create` integration in `/pr-description`** — for GitHub users: offer to run `gh pr create` directly after generating the description. Requires `gh` CLI installed and authenticated. Not needed for Gitea/tea setups.

## Hooks

- **Revisit `SessionEnd` hook event** — `SessionEnd` fires once at true session termination (vs. `Stop` which fires every turn). Would be a cleaner primitive for the session-end update-context reminder. Verify schema and stability when docs mature; currently absent from official hook schemas reference.

## Quality

- **Tests for `scripts/init.ts` and `scripts/install-global.ts`** — especially `appendIfMissing`, `select`, `installCommandsFromDir`, and the conditional FE/BE branching. Required before v1.0.
- **iTerm2 / CSI u note in README** — document the shift+enter keybinding requirement for users who want newline-in-chat.
- **`select()` NaN fallback** — non-numeric input (e.g. empty string on a non-fallback prompt) silently falls to option 1 via `Math.max(0, ...)`. Should validate and re-prompt or explicitly default. Low urgency but surprising behavior.
- **`writeChecksums` no atomic write** — writes directly to `.kit-checksums`; a crash mid-write corrupts the file. Fix: write to a `.kit-checksums.tmp` then `rename`. Low urgency since the file is small and non-critical (worst case: all files treated as unmodified on next update).
- ~~**Stale commands not cleaned from `~/.claude/commands/`**~~ — **Done.** `update.ts` now walks `~/.claude/skills/`, `agents/`, and `hooks/` after each update pass and removes any kit-deployed file (present in checksums) that no longer exists in source. Empty skill dirs are pruned too.
- **`--dry-run` flag for `update.ts`** — useful for previewing what would change before actually writing. Nice-to-have before Verdaccio publish.
