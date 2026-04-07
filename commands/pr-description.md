# /pr-description

Generate a pull request title and description from the current changeset.

## Instructions

Run the following to get the full picture before writing anything:

```bash
# Detect base branch, remote, and repo slug
git symbolic-ref refs/remotes/origin/HEAD --short 2>/dev/null | sed 's|origin/||'
git branch --show-current
git config branch.$(git branch --show-current).remote
git remote get-url $(git config branch.$(git branch --show-current).remote 2>/dev/null || echo origin)

git log $(git symbolic-ref refs/remotes/origin/HEAD --short 2>/dev/null || echo origin/main)...HEAD --oneline
git diff $(git symbolic-ref refs/remotes/origin/HEAD --short 2>/dev/null || echo origin/main)...HEAD
```

From `git remote get-url`, extract the repo slug (`owner/repo`) by stripping the host prefix and `.git` suffix.
For SSH aliases like `gitea-noetic97:noetic97/ai-dev-kit.git`, the slug is everything after the first `:` minus `.git`.
For HTTPS URLs like `https://github.com/owner/repo.git`, take the last two path segments minus `.git`.

Use the detected base branch, remote, and repo slug throughout. Fall back to `main`, `origin`, and omitting `--repo` if detection fails.

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

After generating the description, detect whether a PR already exists for this branch,
then output the appropriate ready-to-run command block.

```bash
# Check for an existing PR on this branch
tea pr list --repo <owner/repo> --head <current-branch> --output json 2>/dev/null
```

If a PR exists, output an **edit** command using the PR number from the list output.
If no PR exists, output a **create** command.

Use a heredoc for the description body to avoid escaping issues with backticks, quotes,
and special characters in markdown content:

```bash
# Push commits (skips if branch already on remote)
git ls-remote --exit-code <remote> <current-branch> \
  && echo "branch already on remote" \
  || git push -u <remote> <current-branch>

# If PR exists — update it:
tea pr edit <pr-number> \
  --repo <owner/repo> \
  --title "<generated title>" \
  --description "$(cat <<'PRBODY'
<generated body>
PRBODY
)"

# If no PR exists — create it:
tea pr create \
  --repo <owner/repo> \
  --title "<generated title>" \
  --description "$(cat <<'PRBODY'
<generated body>
PRBODY
)" \
  --base <detected-base-branch> \
  --head <current-branch>

# GitHub mirror alternative (gh CLI):
# gh pr edit --repo <owner/repo> --title "<title>" --body "$(cat <<'PRBODY'
# <body>
# PRBODY
# )"
# gh pr create --repo <owner/repo> --title "<title>" --body "$(cat <<'PRBODY'
# <body>
# PRBODY
# )" --base <detected-base-branch> --head <current-branch>
```

Output only the relevant block (edit OR create) — not both. Never output `<placeholder>` text literally.

## Rules

- Read the full diff before writing anything — do not summarise from filenames alone
- If any file in the diff is not reflected in the summary, flag it explicitly as potentially missing context
- The title must accurately describe the *dominant* change, not just one part of it
- Do not pad the summary — if it was a small change, the description should be short
- Tone: direct, past tense ("add X", "fix Y", "remove Z")
