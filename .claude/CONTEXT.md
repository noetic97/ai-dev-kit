# Project Context — ai-dev-kit

> This file is the living context for Claude Code sessions.
> Update it freely — it is never touched by the install-global or init scripts.
> Commit it regularly so context is preserved across machines and time.

---

## Current Focus

- PLAN-skills-agents-migration.md **complete** — all 6 phases done on `main`
- IMPL-post-migration-refinements.md **complete** — all 6 steps done

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
- Re-running `ai-init` in an existing project is safe but will never update existing skill files, only create missing ones

---

## Next Up

- **Backlog** — tests for scripts, `--dry-run` for update.ts, Verdaccio publish, framework-aware template injection
- Close IMPL-post-migration-refinements.md (delete file, commit `chore: close post-migration refinements phase`)

---

## Session Notes
