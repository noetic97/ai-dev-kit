# Implementation: Post-Migration Refinements

> Follow-up to `PLAN-skills-agents-migration.md` (now complete).
> Address gaps and inconsistencies discovered during review of the migrated state.
> Each step is a standalone commit — don't batch them. Start a new session per step.

---

## End-of-Session Ritual

At the end of every step:

1. Mark the step complete in this file and record the PR number (or "no PR" for docs-only changes)
2. Update `.claude/CONTEXT.md`: set **Last Completed** and **Next Up** to reflect progress
3. If code changed: run `/full-review` → `/commit` → `/pr-description` → `/clear`
4. If docs/research only: `/commit` → `/pr-description` → `/clear`

---

## Steps

| Step | Description                                    | Status  | Branch | PR  |
| ---- | ---------------------------------------------- | ------- | ------ | --- |
| 1    | Align review loop pass limits                  | complete | fix/align-review-pass-limits | no PR |
| 2    | Resolve memory system references in pr-description | pending | —      | —   |
| 3    | Guard post-write-test hook against kit scripts | complete | fix/hook-guard-kit-scripts | no PR |
| 4    | Document `scope: global` in project template   | complete | docs/scope-global-convention | no PR |
| 5    | Fill in this repo's own `.claude/CLAUDE.md`    | complete | docs/self-documenting-claude-md | no PR |
| 6    | Upgrade session-end hook to trigger update-context | pending | —      | —   |

---

## Step 1 — Align review loop pass limits

**Branch:** `fix/align-review-pass-limits`
**Status:** `pending`
**Scope:** docs-only (skill markdown)

### Problem

`skills/full-review/SKILL.md` and `skills/review-fix-auto/SKILL.md` disagree on the pass limit:

- `full-review` says "pass 1 of 2" and "loop up to 2 passes each"
- `review-fix-auto` says "loop until clean or 3 passes are exhausted" and terminates at `pass = 2` (which means it runs up to 3 passes — 0, 1, 2)

### What to do

Pick a single pass budget and make both skills consistent.

Recommended: **2 passes total** (initial attempt + one retry). More than that and the loop is almost certainly not going to converge — the user needs to step in.

Changes:

1. In `skills/review-fix-auto/SKILL.md`:
   - Change "loop until clean or 3 passes are exhausted" to "loop until clean or 2 passes are exhausted"
   - Change the termination condition to `pass = 2` meaning "stop after pass 2 with remaining issues"
   - Update Step 5 loop condition text
   - Update the "more than 8 Must Fix / Critical items" warning if the limit is referenced

2. In `skills/full-review/SKILL.md`:
   - Confirm "loop up to 2 passes each" matches
   - Confirm "pass 1 of 2" in the delegation messages matches

### Acceptance criteria

- [ ] Both skills use the same pass number
- [ ] The termination condition in `review-fix-auto` is unambiguous (does "pass = 2" mean "after completing pass 2" or "at the start of what would be pass 2"? pick one and phrase clearly)
- [ ] `full-review` delegation messages match the actual behavior of `review-fix-auto`

---

## Step 2 — Resolve memory system references in pr-description

**Branch:** `fix/pr-description-memory-section`
**Status:** `pending`
**Scope:** docs-only (skill markdown)

### Problem

`skills/pr-description/SKILL.md` includes a "Wrap up → Memory review" section that references writing memory files and updating `MEMORY.md`. But:

- There's no `MEMORY.md` template in the repo
- There's no `skills/memory/` skill
- The `.claude/CLAUDE.md` doesn't define what a memory file looks like
- No documentation of what the memory system is, where files live, or what format they take

The instructions are actionable in Claude.ai (which has native memory) but have no defined target in a fresh CC session.

### What to do

Decide which of these is true and act accordingly:

**Option A — Remove the memory section entirely.** If this was leftover from Claude.ai usage patterns and isn't actually part of the kit's design, cut it. The "prompt to start a new chat" section can stay — that's useful context management advice regardless.

**Option B — Define the memory system.** If memory files are genuinely intended as part of the kit, create:
- `templates/memory.md` — the `MEMORY.md` template with defined sections (feedback, project decisions, user profile, etc.)
- A new skill `skills/memory-review/` that encapsulates the "scan session for memorable items" logic (currently inlined in `pr-description`)
- Reference to `MEMORY.md` in `templates/project-claude.md` so consumers know it exists
- Entry in `init.ts` to scaffold `MEMORY.md` on first run (never-overwrite)
- `.claude/CONTEXT.md` section explaining the relationship between CONTEXT and MEMORY

Pick one option. Option A is faster and probably correct. Option B is real work but makes the kit more complete.

### Acceptance criteria

- [ ] `pr-description/SKILL.md` no longer references undefined concepts
- [ ] If Option B: all the artifacts above exist and are coherent
- [ ] The "new chat" reminder remains — that part is good regardless

### Notes for the session

Before choosing, check recent git history and commit messages to see if there was an original intent. Also check `BACKLOG.md` for anything memory-related that would tip the decision.

---

## Step 3 — Guard post-write-test hook against kit scripts

**Branch:** `fix/hook-guard-kit-scripts`
**Status:** `pending`
**Scope:** shell script

### Problem

`hooks/post-write-test.sh` fires on every `Write`/`Edit` tool call. When `install-global.ts` or `init.ts` run and write skill files, the hook tries to run `bun test`. Currently saved by the `find . -name "*.test.ts"` guard returning empty — but the moment this repo adds its own tests (which is in `BACKLOG.md`), the hook will start firing noisily during every install.

### What to do

Add a guard to skip the hook when the write is happening outside a project with a `package.json` that defines a `test` script.

Current hook:
```bash
if command -v bun &> /dev/null && find . -name "*.test.ts" -not -path "*/node_modules/*" | grep -q .; then
  echo "[hook] Running tests after file write..."
  bun test --bail 2>&1 | tail -20
fi
```

Suggested replacement:
```bash
#!/bin/bash
# PostToolUse hook: run tests after Write or Edit tool calls.
# Guards: only fires if (a) bun is available, (b) package.json has a test script,
# and (c) test files exist. This prevents noisy runs during scaffolding.

if ! command -v bun &> /dev/null; then exit 0; fi
if [ ! -f package.json ]; then exit 0; fi
if ! grep -q '"test"' package.json; then exit 0; fi
if ! find . -name "*.test.ts" -not -path "*/node_modules/*" -not -path "*/.claude/*" | grep -q .; then exit 0; fi

echo "[hook] Running tests after file write..."
bun test --bail 2>&1 | tail -20
```

Note the additional `-not -path "*/.claude/*"` guard — prevents the hook from considering test files inside deployed skill directories as triggering conditions.

### Acceptance criteria

- [ ] Hook silently exits when no `package.json` exists
- [ ] Hook silently exits when `package.json` has no `test` script
- [ ] Hook does not consider files in `.claude/` as test files
- [ ] Hook still runs tests normally in a project that has them
- [ ] Manually test: run `bun run install-global` and confirm no test output appears

---

## Step 4 — Document `scope: global` in project template

**Branch:** `docs/scope-global-convention`
**Status:** `pending`
**Scope:** docs-only

### Problem

The `scope: global` frontmatter convention is documented in the ai-dev-kit README and in `.claude/CLAUDE.md` for this repo — but `templates/project-claude.md` (which gets deployed to every scaffolded project) doesn't mention it. Someone scaffolding a new project and reading only their `.claude/CLAUDE.md` won't know the convention exists.

### What to do

Add a one-liner to the Conventions section of `templates/project-claude.md` explaining the convention, so it propagates to every scaffolded project:

```markdown
## Conventions & Exceptions

<!-- Any project-specific deviations from the global CLAUDE.md.
  Example: "This project uses classes for database models due to the ORM." -->

- Skills with `scope: global` frontmatter are toolkit-only — they are deployed to `~/.claude/skills/` by `install-global` but not to this project by `init`. Use this tag for skills that are specific to working on the kit itself, not on projects built with the kit.

{{PROJECT_CONVENTIONS}}
```

Also verify this is in the ai-dev-kit's own `.claude/CLAUDE.md` — it should be, but confirm.

### Acceptance criteria

- [ ] `templates/project-claude.md` documents the `scope: global` convention
- [ ] This repo's `.claude/CLAUDE.md` already documents it (confirm — it does)
- [ ] Future scaffolded projects will include this documentation automatically

---

## Step 5 — Fill in this repo's own `.claude/CLAUDE.md`

**Branch:** `docs/self-documenting-claude-md`
**Status:** `pending`
**Scope:** docs-only

### Problem

The ai-dev-kit's own `.claude/CLAUDE.md` still has `<!-- TODO -->` placeholders for Architecture, Domain Language, Key Data Models, External Integrations, and Security Posture. The kit is now a sophisticated tool that teaches users how to structure these files — but its own example is unfilled. It should be self-documenting.

### What to do

Fill in each placeholder with real content for this repo:

**Architecture:**
```
scripts/         — CLI entry points (init.ts, install-global.ts, update.ts)
scripts/lib/     — pure helpers (checksums, frontmatter parsing)
skills/          — skill source-of-truth (each skill is a directory with SKILL.md + supporting files)
agents/          — subagent definitions (flat .md files)
hooks/           — shell script hooks registered via templates/settings.json
templates/       — file templates consumed by init and install-global
```

**Domain Language:**
```
- "Skill" = a directory under skills/ with SKILL.md entry point; deployable capability
- "Agent" = a subagent definition under agents/; specialist with isolated context and scoped tools
- "Hook" = shell script in hooks/ registered in settings.json; fires on Claude Code lifecycle events
- "Kit" = the ai-dev-kit itself (the repo, not a deployed copy)
- "Deployed artifact" = a file copied to ~/.claude/ or .claude/ by install-global or init; gitignored
- "Source of truth" = the canonical versioned location for skills/agents/hooks/templates (repo root)
```

**Key Data Models:** `scripts/lib/checksums.ts` defines `Checksums` (the only real type). Reference it.

**External Integrations:** None. Note explicitly — this is a local CLI tool.

**Security Posture:**
- Input trust boundary: stdin (prompts) and command-line args in init.ts
- Auth mechanism: none (local filesystem operations only)
- Secret management: none — kit never handles secrets
- `/security-review` is still appropriate before merging changes to file-write logic, especially anything that could write outside the intended directories

### Acceptance criteria

- [ ] No `<!-- TODO -->` placeholders remain in `.claude/CLAUDE.md`
- [ ] Each section has real, specific content (not generic filler)
- [ ] Someone cloning the repo can read `.claude/CLAUDE.md` and understand the codebase

---

## Step 6 — Upgrade session-end hook to trigger update-context

**Branch:** `feat/session-end-context-prompt`
**Status:** `pending`
**Scope:** hook + potentially skill instruction changes

### Problem

`hooks/session-end-reminder.sh` currently just prints a reminder string. The user still has to remember to run `/update-context` manually next session. Meanwhile, `/commit` now includes an inline CONTEXT.md check — which closes the loop for committed work, but doesn't help with exploratory sessions that end without a commit.

### What to do

Evaluate two approaches and pick one:

**Approach A — Smarter reminder (low risk).** Make the hook inspect session state and only print if context probably needs updating. For example:
- If `.claude/CONTEXT.md` hasn't been modified this session (check `git status`)
- AND there have been file writes in this session
- THEN print the reminder, prefixed with a specific prompt like: "Run `/update-context` next session? Recent changes: <list>"

This keeps the hook as a passive reminder but makes it smarter and less noisy.

**Approach B — Active prompt (higher impact, more complexity).** Research whether CC's Stop hook can inject a prompt into the next session or surface a prompt back into the current one. If `sendPrompt`-style functionality exists for hooks, use it to actively trigger `/update-context` at session end rather than just printing text.

This is the "power move" referenced in the review — it closes the loop completely. But it requires confirming the hook capability exists.

### Steps

1. Read the CC hooks documentation to confirm what a `Stop` hook can actually do beyond printing to stdout
2. If Approach B is possible, implement it
3. If not, implement Approach A
4. Test by running a session that modifies files without committing — confirm the reminder fires and has useful content
5. Test by running a session that only reads files — confirm no reminder (noise reduction)

### Acceptance criteria

- [ ] Hook no longer prints unconditionally
- [ ] Hook only reminds when there's something worth updating context about
- [ ] If Approach B is feasible: hook actively triggers `/update-context` flow
- [ ] No false positives on read-only sessions

### Notes for the session

Before implementing, use `/research` to investigate:
- What hook events exist in current CC
- What the Stop hook is allowed to do (stdout only? can it inject prompts?)
- Whether there's a better event than Stop for this (e.g. a SessionEnd or PreStop event)

Document findings in `.claude/RESEARCH-stop-hook-capabilities.md`, then decide approach, then implement.

---

## Closing this phase

When all steps are complete:

1. Delete this file: `git rm IMPL-post-migration-refinements.md`
2. Update `.claude/CONTEXT.md`: clear **Last Completed** phase pointer, note "post-migration refinements complete"
3. Move any deferred items to `BACKLOG.md`
4. Commit: `chore: close post-migration refinements phase`

---

## Maintenance notes

**Ordering flexibility.** Steps 1, 3, 4, and 5 are independent — do them in any order. Step 2 should happen before Step 6 since both touch skill/hook wiring. Step 6 is the most complex and benefits from having a clean base to work against, so probably last.

**Commit size.** Every step here is small enough to be one commit. Don't be tempted to batch "oh, while I'm here I'll also fix X" — that's how review quality degrades. Stay in the blast radius.

**Scope creep watchouts.** Step 2 (memory system) has a real fork in the road. If you pick Option B, it might warrant its own IMPL file rather than one step in this one. Decide early; if it expands beyond one session, split it out.
