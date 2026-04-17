# Implementation: Kiro Companion Kit (Option C)

> Minimal port of ai-dev-kit to Kiro. Skills-only sharing between the two tools.
> Agents, hooks, steering, and deploy scripts are Kiro-native — not translated from the Claude Code kit.
> Goal: validate Kiro's workflow with a working skill set before investing in full dual-target tooling.

---

## Background

Kiro and Claude Code both adopted the open Agent Skills standard. Skills created for one work in the other with zero or near-zero changes. This means `skills/` from ai-dev-kit can be directly reused in Kiro.

The rest of Kiro's primitives (agents, hooks, steering) are structurally different enough that translating them is more trouble than writing them fresh. Option C accepts this and builds a minimal Kiro companion focused on:

1. Making ai-dev-kit's skills usable in Kiro immediately
2. Establishing Kiro-native agents, hooks, and steering for work projects
3. Deferring dual-target unification until we know whether Kiro stays the work home

Team vs solo context matters here: ai-dev-kit is a personal tool optimized for one developer's preferences. The Kiro companion should assume team-authored conventions take precedence — shared steering, team-agreed hooks, less opinionated defaults.

---

## Repo structure

New repo: `ai-kiro-kit` (separate from ai-dev-kit).

```
ai-kiro-kit/
├── README.md
├── AGENTS.md                    ← top-level, auto-included by Kiro (bridge for team context)
├── steering/                    ← source of truth for steering files
│   ├── product.md               ← product vision, features, target users
│   ├── structure.md             ← directory structure and organization
│   ├── tech.md                  ← stack and tooling conventions
│   └── context.md               ← living session context (inclusion: always)
├── skills/                      ← shared with ai-dev-kit (same format)
│   └── <skill-name>/
│       ├── SKILL.md
│       └── <supporting-files>.md
├── agents/                      ← Kiro-native agent JSON configs
│   ├── adversarial-reviewer.json
│   ├── diff-explorer.json
│   └── security-auditor.json
├── hooks/                       ← shell scripts for agent hook commands
│   ├── post-write-test.sh
│   └── session-end-reminder.sh
├── scripts/
│   ├── init.ts                  ← scaffolds a new Kiro project
│   ├── install-global.ts        ← deploys to ~/.kiro/
│   ├── sync-skills.ts           ← pulls skills from local ai-dev-kit clone
│   └── lib/
│       └── checksums.ts         ← reuse from ai-dev-kit (copy, don't symlink)
└── templates/
    ├── project-steering.md      ← per-project steering template
    └── context.md               ← CONTEXT template
```

---

## End-of-Session Ritual

At the end of every step:

1. Mark the step complete in this file and record the PR number
2. Update `steering/context.md`: set **Last Completed** and **Next Up**
3. If code changed: run the full review cycle (once step 5 is done) → commit → PR → `/clear`
4. If docs/scaffolding only: commit → PR → `/clear`

---

## Steps

| Step | Description                                         | Status  | Branch | PR  |
| ---- | --------------------------------------------------- | ------- | ------ | --- |
| 1    | Create repo skeleton and README                     | pending | —      | —   |
| 2    | Author initial steering files                       | pending | —      | —   |
| 3    | Import skills from ai-dev-kit via sync-skills.ts    | pending | —      | —   |
| 4    | Translate three core agents to Kiro JSON format     | pending | —      | —   |
| 5    | Port hooks and wire into agent configs              | pending | —      | —   |
| 6    | Write install-global.ts and init.ts                 | pending | —      | —   |
| 7    | Integrate with native Kiro specs workflow           | pending | —      | —   |
| 8    | Validate end-to-end on a real work project          | pending | —      | —   |

---

## Step 1 — Create repo skeleton and README

**Branch:** `init/repo-skeleton`
**Status:** `pending`
**Scope:** new files, docs

### What to do

1. Initialize the `ai-kiro-kit` repo with the directory structure above (empty directories + `.gitkeep` where needed)
2. Write a README explaining:
   - Purpose: Kiro-specific companion to ai-dev-kit
   - Team orientation: steering files are expected to be team-authored
   - Relationship to ai-dev-kit: skills are shared; everything else is Kiro-native
   - Quick start: clone, run install-global, scaffold a new project
3. Add a top-level `AGENTS.md` — this is the bridge file Kiro auto-includes. Keep it minimal and point to the steering directory:

   ```markdown
   # AGENTS.md

   This project uses Kiro for AI-assisted development. Primary steering lives in `.kiro/steering/`.
   Skills are imported from ai-kiro-kit. Custom agents are in `.kiro/agents/`.

   Always read `.kiro/steering/context.md` at the start of a session before doing anything else.
   ```

4. Create a `.gitignore` that matches ai-dev-kit's pattern for deployed artifacts:
   ```
   .kiro/skills/
   .kiro/agents/
   .kiro/hooks/
   ```

### Acceptance criteria

- [ ] Repo is initialized with the full directory structure
- [ ] README explains purpose and relationship to ai-dev-kit
- [ ] AGENTS.md exists at root and is minimal
- [ ] Deployed artifact directories are gitignored

---

## Step 2 — Author initial steering files

**Branch:** `feat/initial-steering`
**Status:** `pending`
**Scope:** new markdown files

### Problem

Kiro splits what Claude Code puts in one `CLAUDE.md` into multiple focused steering files. Native Kiro convention is `product.md`, `structure.md`, `tech.md`. These are team-authored in real use, but for the kit we need sensible templates that make it obvious what each file is for.

### What to do

Create four steering files in `steering/`:

**`product.md`** (inclusion: always)
- Template for product vision, target users, core features
- Placeholder sections the team fills in per project
- Short examples of what good content looks like

**`structure.md`** (inclusion: always)
- Template for documenting directory layout
- Prompts for: domain layers, I/O boundaries, shared utilities
- Lean — the project determines the content

**`tech.md`** (inclusion: always)
- Stack, runtime, testing framework, linting
- Paradigm preferences section (OOP vs FP — team-decided, not opinionated by default)
- Key dependencies

**`context.md`** (inclusion: always)
- Living session context, direct port of ai-dev-kit's `CONTEXT.md`
- Current focus, active decisions, in progress, known gotchas, next up, session notes
- Frontmatter: `inclusion: always`

Each file must start with:
```
---
inclusion: always
---
```

### Design principle

Unlike ai-dev-kit's opinionated global CLAUDE.md (which enforces FP, named exports, etc.), these templates are **team-neutral**. They prompt the team to write their own conventions rather than imposing one developer's preferences.

### Acceptance criteria

- [ ] Four steering files exist with correct frontmatter
- [ ] Each is a template with clear placeholders, not filled-in content
- [ ] `context.md` mirrors ai-dev-kit's structure for consistency
- [ ] README references the steering directory as the place teams should customize first

---

## Step 3 — Import skills from ai-dev-kit via sync-skills.ts

**Branch:** `feat/sync-skills`
**Status:** `pending`
**Scope:** TypeScript script + initial skill import

### Problem

Skills are format-identical between Claude Code and Kiro, but we don't want to symlink or vendor them blindly. We want a deliberate sync step that pulls specific skills from a local ai-dev-kit clone and copies them in. This keeps the kits independent while making sharing explicit.

### What to do

1. Write `scripts/sync-skills.ts`:
   - Takes a path to the local ai-dev-kit repo (default: `~/code/ai-dev-kit`)
   - Reads a manifest file `scripts/skills-manifest.json` listing which skills to import
   - For each listed skill, copies `<ai-dev-kit>/skills/<name>/` to `skills/<name>/`
   - Records the source commit SHA in a `.skill-source` file inside each imported skill directory
   - Skips skills with `scope: global` frontmatter (those are ai-dev-kit-specific)

2. Create `scripts/skills-manifest.json` with the initial import set:
   ```json
   {
     "source": "~/code/ai-dev-kit",
     "skills": [
       "code-review",
       "adversarial-review",
       "security-review",
       "new-module",
       "new-feature",
       "bug-hunter",
       "review-fix",
       "review-fix-auto",
       "full-review",
       "pr-description",
       "commit",
       "update-context",
       "changelog",
       "adr",
       "research",
       "new-phase"
     ]
   }
   ```

3. Run the sync and commit the imported skills to the repo

4. Review each imported skill's `SKILL.md` for Claude-specific references:
   - `~/.claude/CLAUDE.md` references should become `.kiro/steering/`
   - `.claude/CONTEXT.md` references should become `.kiro/steering/context.md`
   - Any CC-specific slash command examples should be verified to work in Kiro (they should — same invocation pattern)

### Acceptance criteria

- [ ] `sync-skills.ts` works against a local ai-dev-kit clone
- [ ] Manifest-driven import is explicit and reproducible
- [ ] All listed skills are imported and committed
- [ ] Claude Code-specific file path references are updated
- [ ] Each imported skill has a `.skill-source` file recording its origin SHA

### Notes

The `.skill-source` file is the poor-man's version of a dependency lockfile. When ai-dev-kit updates a skill, re-running sync will show which skills have diverged from their recorded SHA. Good enough for now; can formalize later if Option B becomes real.

---

## Step 4 — Translate three core agents to Kiro JSON format

**Branch:** `feat/core-agents`
**Status:** `pending`
**Scope:** new JSON files

### What to do

Translate ai-dev-kit's three markdown agents to Kiro JSON configs. Each goes in `agents/<name>.json`.

**`agents/adversarial-reviewer.json`:**
```json
{
  "name": "adversarial-reviewer",
  "description": "Skeptical senior engineer who did not write the code under review. Read-only — cannot write fixes, only find problems.",
  "tools": ["read"],
  "allowedTools": ["read"],
  "resources": [
    "file://.kiro/steering/**/*.md",
    "skill://.kiro/skills/**/SKILL.md"
  ],
  "prompt": "<port the markdown body from ai-dev-kit/agents/adversarial-reviewer.md verbatim>",
  "model": "claude-sonnet-4"
}
```

**`agents/diff-explorer.json`** — same pattern, tools limited to `["read"]`, port the prompt body.

**`agents/security-auditor.json`** — same pattern, tools `["read"]`, port the prompt body.

### Translation rules

- `tools:` frontmatter from ai-dev-kit (e.g. `Read, Grep, Glob, Bash`) → Kiro tool names (`read`, `shell`). Kiro's canonical names are `fs_read`, `fs_write`, `execute_bash`, `use_aws` with aliases `read`, `write`, `shell`, `aws`. Use aliases for readability.
- `allowedTools:` should be the same as `tools:` for read-only agents — defense in depth.
- Markdown agent body → `prompt` field (JSON-escape newlines and quotes)
- `model:` field uses Kiro's model names. `claude-sonnet-4` is the current default.
- `resources:` should always include steering and skills so agents inherit team context.

### Acceptance criteria

- [ ] Three agent JSON files exist and are valid JSON
- [ ] Each has correct tool scoping (read-only for all three)
- [ ] Prompt bodies match their ai-dev-kit markdown counterparts
- [ ] Resources include steering and skills globs

### Notes

The JSON-in-a-string prompt is ugly compared to markdown. If this becomes painful, consider writing the prompts as markdown in `agents/prompts/*.md` and having `install-global.ts` assemble the JSON at deploy time. Defer that unless it actually hurts.

---

## Step 5 — Port hooks and wire into agent configs

**Branch:** `feat/hooks`
**Status:** `pending`
**Scope:** shell scripts + agent config updates

### Problem

Kiro hooks are per-agent, not global. The ai-dev-kit hooks need to be copied over AND registered inside each agent config that should fire them. There's no single `settings.json` like Claude Code has.

### What to do

1. Copy `hooks/post-write-test.sh` and `hooks/session-end-reminder.sh` from ai-dev-kit into `hooks/`. The shell logic is unchanged — Kiro hooks run shell commands the same way.

2. Apply the Step 3 guard improvements (from ai-dev-kit IMPL Step 3) to `post-write-test.sh`:
   ```bash
   if ! command -v bun &> /dev/null; then exit 0; fi
   if [ ! -f package.json ]; then exit 0; fi
   if ! grep -q '"test"' package.json; then exit 0; fi
   if ! find . -name "*.test.ts" -not -path "*/node_modules/*" -not -path "*/.kiro/*" | grep -q .; then exit 0; fi
   ```

3. Decide hook registration strategy. Two options:

   **Option 5A — Register in a default agent.** Create `agents/kiro-default.json` (or whatever the team's primary agent is called) and register hooks there:
   ```json
   {
     "hooks": {
       "postToolUse": [
         { "matcher": "fs_write", "command": ".kiro/hooks/post-write-test.sh" }
       ],
       "stop": [
         { "command": ".kiro/hooks/session-end-reminder.sh" }
       ]
     }
   }
   ```

   **Option 5B — Document and let teams opt in.** Don't register hooks by default; document them in the README and let each team choose which agents fire them.

   Recommend **5B for the kit**, since this is team-oriented and some teams won't want auto-test-on-write. Ship the hook scripts, document clearly, provide a snippet to copy into their agent config.

4. Update the README with:
   - What each hook does
   - Why it's off by default
   - Copy-paste JSON snippet for enabling it

### Acceptance criteria

- [ ] Both hook scripts exist in `hooks/` and are executable
- [ ] `post-write-test.sh` has the improved guards
- [ ] README documents hooks and how to enable them per-agent
- [ ] No agent is forced to run hooks unless the team chooses

### Notes

Kiro IDE has a separate concept of `.kiro/hooks/*.kiro.hook` files that are file-watch based and richer than CLI agent hooks. For now, ignore those — they're IDE-only and our scope is CLI-compatible. If the team wants IDE hooks later, they can create them through Kiro's UI.

---

## Step 6 — Write install-global.ts and init.ts

**Branch:** `feat/deploy-scripts`
**Status:** `pending`
**Scope:** TypeScript

### What to do

Port ai-dev-kit's deploy scripts to target `~/.kiro/` and `.kiro/` paths. Most logic carries over directly — the checksum system, conflict detection, and never-overwrite semantics all still apply.

1. Copy `scripts/lib/checksums.ts` from ai-dev-kit verbatim. Change the default `checksumsPath` from `~/.claude/.kit-checksums` to `~/.kiro/.kiro-kit-checksums`.

2. Write `scripts/install-global.ts`:
   - Deploys `skills/` → `~/.kiro/skills/`
   - Deploys `agents/` → `~/.kiro/agents/`
   - Deploys `hooks/` → `~/.kiro/hooks/`
   - Deploys `steering/` files to `~/.kiro/steering/` (never-overwrite, since user may have customized)
   - Records checksums for all deployed files

3. Write `scripts/init.ts`:
   - Scaffolds `.kiro/` directory structure in target project
   - Copies skills, agents, hooks (never-overwrite)
   - Creates `.kiro/steering/` with the four steering files from templates
   - Creates project-level `AGENTS.md` at repo root pointing to `.kiro/steering/`
   - No interactive prompts for now — teams fill in steering files themselves

4. Add `package.json` scripts:
   ```json
   {
     "scripts": {
       "install-global": "bun scripts/install-global.ts",
       "init": "bun scripts/init.ts",
       "sync-skills": "bun scripts/sync-skills.ts"
     }
   }
   ```

### Differences from ai-dev-kit scripts

- **No `CLAUDE.md` append-if-missing logic.** Kiro steering is a directory, not a single file. Each steering file is written independently.
- **No interactive prompts in init.** ai-dev-kit's init asks about project type, framework, etc. For a team tool, skip the prompts and ship the templates — teams customize the steering files manually.
- **Never-overwrite applies to all files.** Hand-edits are sacred in a team context. No merge logic.
- **No AGENTS.md append logic.** If the project already has an AGENTS.md, don't touch it — print a note that Kiro will auto-include it.

### Acceptance criteria

- [ ] `install-global.ts` deploys all four directories correctly
- [ ] `init.ts` scaffolds a new project without interactive prompts
- [ ] Checksums are recorded for all deployed files
- [ ] Existing files in target directories are never overwritten
- [ ] Running init twice in the same project is a no-op

---

## Step 7 — Integrate with native Kiro specs workflow

**Branch:** `feat/specs-integration`
**Status:** `pending`
**Scope:** docs + skill updates

### Problem

Kiro has a first-class specs feature: natural-language prompt → requirements in EARS notation → design doc → implementation tasks. Your `new-feature` skill does something similar but without IDE integration.

Two approaches: keep the skill as-is (works, but duplicates effort) or delegate to Kiro's native spec workflow.

### What to do

1. Update the imported `new-feature` skill's `SKILL.md` to offer Kiro's spec workflow as the default path:

   ```markdown
   ## Recommended: use Kiro's native spec workflow

   For new features, prefer Kiro's built-in spec generation over this skill:
   1. Describe the feature in natural language
   2. Let Kiro generate requirements in EARS notation
   3. Refine requirements before design
   4. Kiro generates a design doc with data flows and interfaces
   5. Kiro creates a task list you can execute

   Use this skill only when you want a lightweight spec without IDE spec generation
   (e.g. working from the CLI without spec UI).
   ```

2. Document in the README: when to use `new-feature` skill vs native Kiro specs:
   - Native specs: IDE feature work, team-shared spec artifacts
   - `new-feature` skill: CLI-only work, quick features without full spec overhead, or when working in a non-Kiro tool later

3. Do NOT remove the skill — it still works in the CLI and is useful when the spec UI is overkill.

### Acceptance criteria

- [ ] `new-feature` skill documents Kiro's native workflow as the preferred path
- [ ] README clearly states when to use which
- [ ] Skill still works as a fallback for CLI / lightweight use

---

## Step 8 — Validate end-to-end on a real work project

**Branch:** `n/a (validation, not code)`
**Status:** `pending`
**Scope:** dogfooding

### What to do

Pick a real work project. Run through the full flow:

1. `bun run install-global` in `ai-kiro-kit`
2. `bun run init` in the work project
3. Fill in the four steering files with project-specific content
4. Start a Kiro session and test:
   - Does `/code-review` work and pull in project steering?
   - Does the `adversarial-reviewer` agent spawn with read-only tools?
   - Does `/commit` produce a conventional commit message that matches the steering conventions?
   - Does `/pr-description` work against whatever git host the team uses?
   - Can you chain `/full-review` → fix loop → `/adversarial-review` → fix loop?

5. Note every friction point in a `.kiro/RESEARCH-kiro-validation.md`:
   - Skills that need Kiro-specific adjustments
   - Agents that need different tool scoping
   - Hook behaviors that don't fit Kiro's lifecycle
   - Steering files that should be split differently

6. Decide: is this working well enough to use day-to-day? If yes, merge to main. If no, the RESEARCH file becomes the input to a follow-up IMPL.

### Acceptance criteria

- [ ] Full flow works end-to-end on at least one real project
- [ ] RESEARCH doc captures friction points
- [ ] Decision is recorded: ship as-is, iterate, or rethink

---

## Closing this phase

When all steps are complete:

1. Merge `ai-kiro-kit` to main with a first tagged release (`v0.1.0`)
2. Delete this file: `git rm IMPL-kiro-companion-kit.md`
3. Update `steering/context.md`: note "Option C complete — ai-kiro-kit v0.1.0 shipped"
4. Open a BACKLOG item for Option B (dual-target unification) with the learnings from Step 8's RESEARCH doc

---

## Maintenance notes

**Skill drift.** The `.skill-source` files record SHAs from ai-dev-kit at import time. Re-running `sync-skills.ts` periodically will show which skills have diverged. Decide per-skill whether to re-import (accept upstream) or cherry-pick changes (if the Kiro version has local modifications).

**Team onboarding.** When a new team member joins, the flow is: clone work project → `bun run init` in ai-kiro-kit → work project auto-gets `.kiro/` structure. They should read the four steering files first.

**Steering ownership.** Make it explicit: `product.md`, `structure.md`, `tech.md` are team-authored and live in version control. `context.md` is per-developer working state — consider whether to commit it or gitignore it based on team norms. (Defer this decision; start with committed, flip if it becomes noisy.)

**Hooks default.** Deliberately shipped off. Some teams will enable the test-on-write hook immediately; others will find it intrusive. Let them choose.

**Don't port everything.** Resist the urge to translate every ai-dev-kit feature. The two tools have different strengths. ai-dev-kit's per-developer opinionation isn't right for a team context; Kiro's native specs and Powers aren't worth duplicating in the personal kit. Let them evolve separately.

**When to revisit Option B.** If you find yourself manually keeping skills in sync between both kits, or if both kits end up needing the same new capability simultaneously, that's the signal. Until then, divergence is fine.
