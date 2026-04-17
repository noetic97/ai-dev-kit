# Project Context — ai-dev-kit

> This file is the living context for Claude Code sessions.
> Update it freely — it is never touched by the install-global or init scripts.
> Commit it regularly so context is preserved across machines and time.

---

## Current Focus

- Continuing PLAN-skills-agents-migration.md on branch `dev-kit-refactor`
- Phases 1–3 complete. Next: Phase 4 (Hooks), Phase 5 (Deploy scripts), Phase 6 (Backlog cleanup)

---

## Deployment Model (canonical — do not re-litigate)

```
Root (source of truth, version-controlled)     Deployed artifacts (gitignored)
───────────────────────────────────────────    ──────────────────────────────────────
skills/                                    →   .claude/skills/
agents/                                    →   .claude/agents/
hooks/                                     →   .claude/hooks/
templates/settings.json                    →   .claude/settings.json
templates/project-claude.md                →   .claude/CLAUDE.md   (never-overwrite)
templates/context.md                       →   .claude/CONTEXT.md  (never-overwrite)
```

- `.claude/CLAUDE.md` and `.claude/CONTEXT.md` in THIS repo are live working files, not artifacts — they are committed.
- Everything else under `.claude/` is a deployed artifact — gitignored, populated by `init` or `install-global`.
- `settings.json` deploy strategy: never-overwrite (JSON can't be string-appended safely).
- `scope: global` frontmatter on a skill = `install-global` only, not `init`.

---

## Active Decisions

- `commands/` directory is gone — fully migrated to `skills/`
- All migration work is on `dev-kit-refactor` branch — one PR when phases complete
- Slash commands are entered inside a `claude` session, not the terminal shell
- FE/BE framework split in init prompts — `frontendFramework` and `backendFramework` are separate fields

---

## In Progress

- Nothing — all committed and clean

---

## Known Gotchas

- `shift+enter` newline binding doesn't work in standard Terminal.app — requires iTerm2 with CSI u mode enabled (Preferences → Profiles → Keys → Report modifiers using CSI u)
- Deploy scripts (`install-global.ts`, `init.ts`, `update.ts`) still reference `commands/` paths — they are broken until Phase 5 is done. Do not run them until then.
- Re-running `ai-init` in an existing project is safe but will never update existing skill files, only create missing ones

---

## Next Up

- **Phase 4** — Hooks: `post-write-test.sh` (PostToolUse on Write/Edit) and `session-end-reminder.sh` (Stop event). Need `.claude/settings.json`. Note: hooks live in `.claude/` which is gitignored — need to decide if hooks source lives in a `hooks/` dir at root like skills/agents, or if they're configured differently. Raise this at start of next session.
- **Phase 5** — Update `scripts/install-global.ts`, `scripts/init.ts`, `scripts/update.ts` for new `skills/` and `agents/` paths. Plan first before writing code.
- **Phase 6** — Backlog cleanup: close review-agent item, fix `select()` NaN fallback, stale skills removal logic

---

## Session Notes
