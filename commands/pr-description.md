# /pr-description

Generate a pull request title and description from the current changeset.

## Instructions

Run the following to get the full picture before writing anything:

```bash
# Detect base branch and remote
git symbolic-ref refs/remotes/origin/HEAD --short 2>/dev/null | sed 's|origin/||'
git branch --show-current
git config branch.$(git branch --show-current).remote

git log $(git symbolic-ref refs/remotes/origin/HEAD --short 2>/dev/null || echo origin/main)...HEAD --oneline
git diff $(git symbolic-ref refs/remotes/origin/HEAD --short 2>/dev/null || echo origin/main)...HEAD
```

Use the detected base branch and remote throughout. Fall back to `main` and `origin` if detection fails.

Read **every changed file** in the diff — not just source code. Documentation, config,
templates, and command files all count. A missing entry in README.md or a new file not
reflected in a config is a gap that belongs in the PR description.

## Output Format

**Title** — one line, under 70 characters, conventional commit style:
`<type>: <concise description>`
Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`

**Summary** — 3–6 bullet points covering what changed and why. Group related changes.
Do not list every file — describe the logical changes they represent.

**Changed files** — a brief flat list of every file touched, annotated with one of:
`added` | `modified` | `deleted`. This is the completeness check — nothing should be missing.

**Test plan** — a short checklist of what to verify before merging. Be specific to this
changeset, not generic.

## Create the PR

After generating the description, output a ready-to-run command block using the detected
branch, remote, and base branch from the Instructions step.

Use a heredoc for the description body to avoid escaping issues with backticks, quotes,
and special characters in markdown content:

```bash
# Only push if branch is not already on the remote
git ls-remote --exit-code <remote> <current-branch> || git push -u <remote> <current-branch>

# Create PR (Gitea via tea CLI)
tea pr create \
  --title "<generated title>" \
  --description "$(cat <<'PRBODY'
<generated body — paste full markdown here>
PRBODY
)" \
  --base <detected-base-branch> \
  --head <current-branch>

# Alternatively, if pushing to GitHub mirror:
# gh pr create --title "<generated title>" --body "$(cat <<'PRBODY'
# <generated body>
# PRBODY
# )" --base <detected-base-branch> --head <current-branch>
```

Substitute all placeholders with actual values. Never output `<placeholder>` text literally.

## Rules

- Read the full diff before writing anything — do not summarise from filenames alone
- If any file in the diff is not reflected in the summary, flag it explicitly as potentially missing context
- The title must accurately describe the *dominant* change, not just one part of it
- Do not pad the summary — if it was a small change, the description should be short
- Tone: direct, past tense ("add X", "fix Y", "remove Z")
