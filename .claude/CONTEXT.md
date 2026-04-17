# Project Context — ai-dev-kit

> This file is the living context for Claude Code sessions.
> Update it freely — it is never touched by the install-global or init scripts.
> Commit it regularly so context is preserved across machines and time.

---

## Current Focus

- Working through PLAN-skills-agents-migration.md — migrating commands to skills/agents structure
- On branch `dev-kit-refactor` — all plan work goes here, single PR at end

---

## Active Decisions

- `commands/toolkit/` is for toolkit-only commands — not deployed to projects via init, only via install-global
- `commands/` universal commands are deployed by both init and install-global
- Slash commands are entered inside a `claude` session, not the terminal shell
- FE/BE framework split in init prompts — `frontendFramework` and `backendFramework` are separate fields
- `commands/` uses `readdirSync` dynamic discovery — no static file lists to maintain
- `.claude/commands/` is gitignored — deployed copy is local-only, source of truth is `commands/`
- All migration work is on `dev-kit-refactor` branch — one PR for the full plan

---

## In Progress

- Phase 1.2 — adding frontmatter to all remaining commands (next step)

---

## Known Gotchas

<!-- Things that will bite Claude if it doesn't know about them. -->

- `shift+enter` newline binding doesn't work in standard Terminal.app — requires iTerm2 with CSI u mode enabled (Preferences → Profiles → Keys → Report modifiers using CSI u)
- `commands/toolkit/` is intentionally invisible to `init` — adding a command there won't appear in scaffolded projects
- Re-running `ai-init` in an existing project is safe but will never update existing command files, only create missing ones

---

## Next Up

- Phase 1.2: frontmatter on all remaining commands
- Phase 2: create `.claude/agents/` with adversarial-reviewer, diff-explorer, security-auditor
- Phase 3: migrate commands to `commands/skills/<name>/SKILL.md` directory structure
- Phase 4: hooks (post-write test, session-end reminder)
- Phase 5: update deploy scripts for new structure
- Phase 6: backlog cleanup

---

## Session Notes

<!-- Scratch space. Cleared between major milestones. -->
