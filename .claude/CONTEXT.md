# Project Context — ai-dev-kit

> This file is the living context for Claude Code sessions.
> Update it freely — it is never touched by the install-global or init scripts.
> Commit it regularly so context is preserved across machines and time.

---

## Current Focus

- Dog-fooding the command set on the ai-dev-kit repo itself — testing commands on commands, docs, and scripts
- Not yet using on the todo-app POC; that comes after this commit flow is validated
- Nothing currently locked or off-limits

---

## Active Decisions

<!-- Decisions made recently that affect how Claude should behave in this project.
  These don't need a full ADR yet — just enough to avoid relitigating them. -->

- `commands/toolkit/` is for toolkit-only commands — not deployed to projects via init, only via install-global
- `commands/` universal commands are deployed by both init and install-global
- Slash commands are entered inside a `claude` session, not the terminal shell
- FE/BE framework split in init prompts — `frontendFramework` and `backendFramework` are separate fields
- `commands/` uses `readdirSync` dynamic discovery — no static file lists to maintain

---

## In Progress

<!-- Work that is started but not complete. Helps Claude avoid stomping on WIP. -->

- Uncommitted changes across `scripts/`, `commands/`, `templates/`, `README.md` from this session
- Working through code-review → adversarial-review → pr-description → commit flow to validate commands

---

## Known Gotchas

<!-- Things that will bite Claude if it doesn't know about them. -->

- `shift+enter` newline binding doesn't work in standard Terminal.app — requires iTerm2 with CSI u mode enabled (Preferences → Profiles → Keys → Report modifiers using CSI u)
- `commands/toolkit/` is intentionally invisible to `init` — adding a command there won't appear in scaffolded projects
- Re-running `ai-init` in an existing project is safe but will never update existing command files, only create missing ones

---

## Next Up

<!-- Queued work, in rough priority order. -->

- Run `bun run install-global` to deploy new commands to `~/.claude/`
- Run code-review → adversarial-review → pr-description → commit on current session changes
- Add iTerm2 / CSI u note to README (shift+enter setup)
- Backlog: init idempotency — skip prompts for already-answered fields on re-runs
- Backlog: deploy a quickstart/README alongside commands when init runs on a new project

---

## Session Notes

<!-- Scratch space. Cleared between major milestones. -->
