# /pr-description

Generate a pull request title and description from the current changeset.

## Instructions

Run the following to get the full picture before writing anything:

```bash
git log main...HEAD --oneline
git diff main...HEAD
```

If there is no `main` branch, use `git log --oneline` and `git diff HEAD~1` instead.

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

## Rules

- Read the full diff before writing anything — do not summarise from filenames alone
- If any file in the diff is not reflected in the summary, flag it explicitly as potentially missing context
- The title must accurately describe the *dominant* change, not just one part of it
- Do not pad the summary — if it was a small change, the description should be short
- Tone: direct, past tense ("add X", "fix Y", "remove Z")
