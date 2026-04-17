---
name: sync-docs
description: Verify the README slash commands table matches the actual skills in this repo. Toolkit-only — use in the ai-dev-kit repo, not in scaffolded projects.
allowed-tools: Read, Write, Bash, Grep, Glob
model: sonnet
scope: global
---

# /sync-docs

Verify that the README slash commands table matches the actual skills in this repo.

## Instructions

This skill is specific to the ai-dev-kit repo. Do not use it in projects scaffolded by init.

Run the following to get the current state:

```bash
ls skills/
```

Then read `README.md` and find the slash commands table (under `## Slash commands`).

## What to check

1. **Missing from README** — any directory in `skills/` that has no corresponding row in the table
2. **Stale in README** — any row in the table that points to a skill that no longer exists
3. **Wrong description** — read the `description` field from each skill's `SKILL.md` frontmatter and compare it to the README description. Flag significant mismatches.

Skills with `scope: global` should be listed in the table with a note that they are toolkit-only.

## Output

Report findings as:

**Missing entries** — skills with no README row (add these)
**Stale entries** — README rows with no matching skill directory (remove these)
**Description mismatches** — where the README description doesn't match the skill's stated purpose

Then apply all fixes directly to `README.md`. Do not ask for confirmation — fix and report what changed.
