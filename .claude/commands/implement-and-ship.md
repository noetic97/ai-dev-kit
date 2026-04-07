# /implement-and-ship

Orchestrate the full flow from module scaffolding to a committed, reviewed PR.

## Instructions

Run this when you are about to build a new module and want the full quality gate applied
before committing. Work through each phase in order. Do not skip phases.

---

## Phase 1 — Scaffold

Follow the `/new-module` workflow:
- Ask for module name, purpose, inputs/outputs, and dependencies
- Propose file structure and function signatures
- Wait for approval before writing any code
- Implement once approved

---

## Phase 2 — Review (round 1)

Without being prompted, run both reviews back to back:

1. `/code-review` — evaluate against correctness, FP conventions, TypeScript quality, tests, readability, and architecture
2. `/adversarial-review` — switch roles and find what's wrong: edge cases, logic errors, test gaps, security holes

Compile a combined fix list. Separate **blocking** (must fix before shipping) from **non-blocking** (worth noting but won't hold the commit).

---

## Phase 3 — Fix

Apply all blocking fixes from Phase 2. For each fix, state what you changed and why.

---

## Phase 4 — Review (round 2)

Repeat Phase 2. If no new blocking issues are found, proceed. If blocking issues remain, apply fixes and note that a third round was needed — this is a signal the original implementation needed more thought.

Cap at 2 fix rounds. If blocking issues persist after round 2, stop and surface them to the user rather than committing.

---

## Phase 5 — Ship

1. Run `/pr-description` to generate the PR title and description
2. Run `/commit` to stage and commit with a conventional commit message

Report the commit hash and a one-line summary when done.
