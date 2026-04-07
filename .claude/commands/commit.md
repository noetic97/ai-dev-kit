# /commit

Stage changed files and commit with a descriptive conventional commit message.

## Instructions

Run the following to understand what has changed:

```bash
git status
git diff
git diff --staged
```

## Steps

1. **Identify what to stage** — list the files that belong to this logical change. If unrelated changes are present in the working tree, stage only the relevant files and note what was left out.

2. **Draft the commit message** — follow the conventional commit format:
   ```
   <type>: <concise description>
   ```
   Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`

   The description should explain *what changed and why*, not just restate the filenames.
   Keep it under 72 characters.

   If the change warrants it, add a short body (one blank line after the subject) with additional context.

3. **Stage and commit**:
   ```bash
   git add <specific files>
   git commit -m "<message>"
   ```

   Always add the co-author trailer:
   ```
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```

## Rules

- Never use `git add .` or `git add -A` — always add specific files
- Never use `--no-verify`
- If a pre-commit hook fails, fix the underlying issue — do not bypass it
- Do not commit `.env` files, credentials, debug logs, or commented-out code
- If the working tree contains changes that should be a separate commit, say so and stop
