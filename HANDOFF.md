# Session Handoff — ai-dev-kit

> Paste this into your first Claude Code CLI session to restore full context.
> After that, keep CONTEXT.md updated so you never need a doc like this again.

---

## What this repo is

`ai-dev-kit` is a personal Claude Code toolkit — a git-tracked source of truth for
steering files, slash commands, and project scaffolding. It is private and local.

The install flow has two scripts:

- `scripts/install-global.ts` — deploys `CLAUDE.md` and `commands/` to `~/.claude/`
- `scripts/init.ts` — scaffolds a new project with `.claude/CLAUDE.md`, `.claude/CONTEXT.md`, `.claude/commands/`, and `.claudeignore`

---

## Repo structure

```
ai-dev-kit/
├── CLAUDE.md                        ← global base steering file (source of truth)
├── README.md
├── package.json
├── templates/
│   ├── project-claude.md            ← project CLAUDE.md template ({{tokens}} filled by init)
│   ├── context.md                   ← CONTEXT.md template (living session context)
│   └── claudeignore                 ← base .claudeignore
├── commands/
│   ├── new-module.md                ← /new-module slash command
│   ├── adr.md                       ← /adr slash command
│   └── code-review.md               ← /code-review slash command
└── scripts/
    ├── init.ts                      ← project scaffolding script
    └── install-global.ts            ← deploys to ~/.claude/
```

---

## Key design decisions made so far

- `~/.claude/` is NOT a git repo — it is a deploy target only, never edited directly
- `CONTEXT.md` is separated from `CLAUDE.md` because it has a different lifecycle:
  conventions are stable, focus changes constantly
- The init script uses merge/append strategy — never overwrites existing files
- `CONTEXT.md` is the one exception — it is never overwritten even on re-init,
  because it is hand-maintained session state
- Commands are also never overwritten on re-init so project customisations are safe
- Bun is the preferred runtime; Node only if project constraints require it
- All code is functional TypeScript, strict mode, no classes

---

## What still needs doing in this repo

- [ ] `scripts/install-global.ts` — exists in concept, needs to be written
- [ ] `templates/context.md` — created, but this repo's own `.claude/CONTEXT.md`
      needs to be filled in after init is run on itself
- [ ] Run `bun scripts/init.ts .` on this repo to self-bootstrap its own `.claude/` setup
- [ ] Consider adding more slash commands: `pr-description`, `refactor-to-fp`
- [ ] Explore Verdaccio for self-hosted package registry (deferred — toolkit not stable yet)

---

## Conventions to follow in this repo

- TypeScript strict, Bun runtime
- Functional — no classes, no mutation
- Atomic commits with conventional commit format (`feat:`, `fix:`, `chore:` etc.)
- Tests fix code, not the other way around (unless behaviour intentionally changed)
- Plan first, wait for approval before writing code

---

## Suggested first prompt for your CLI session

```
Read README.md, .claude/CLAUDE.md, and .claude/CONTEXT.md to orient yourself.
Then help me write scripts/install-global.ts — it should deploy CLAUDE.md and
the contents of commands/ to ~/.claude/, using the same merge strategy as init.ts.
Propose a plan before writing any code.
```
