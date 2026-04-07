# /sync-docs

Verify that the README slash commands table matches the actual commands in this repo.

## Instructions

This command is specific to the ai-dev-kit repo. Do not use it in projects scaffolded by init.

Run the following to get the current state:

```bash
ls commands/
ls commands/toolkit/
```

Then read `README.md` and find the slash commands table (under `## Slash commands`).

## What to check

1. **Missing from README** — any `.md` file in `commands/` or `commands/toolkit/` that has no corresponding row in the table
2. **Stale in README** — any row in the table that points to a command file that no longer exists
3. **Wrong description** — read the first non-heading, non-blank line of each command file and compare it to the README description. Flag significant mismatches.

Toolkit-only commands (in `commands/toolkit/`) should be listed in the table with a note that they are toolkit-only.

## Output

Report findings as:

**Missing entries** — commands with no README row (add these)
**Stale entries** — README rows with no matching file (remove these)
**Description mismatches** — where the README description doesn't match the command's stated purpose

Then apply all fixes directly to `README.md`. Do not ask for confirmation — fix and report what changed.
