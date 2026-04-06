# /code-review

Perform a thorough code review on the specified files or diff.

## Instructions

Review the files I point you to, or the current git diff if I say "review my changes".

Run: `git diff` or `git diff main` to get the changeset if not explicitly provided.

## Review Criteria

Evaluate against these dimensions in order of priority:

### 1. Correctness
- Does the code do what it's supposed to do?
- Are there edge cases that aren't handled?
- Are there off-by-one errors, null/undefined risks, or type unsafety?

### 2. Functional Purity & FP Conventions
- Are functions pure where they should be?
- Is there any hidden mutation of inputs or shared state?
- Could this be composed more cleanly?
- Are side effects properly isolated to the edges?

### 3. TypeScript Quality
- Is `any` used? Should it be `unknown` with narrowing?
- Are types descriptive and accurate, or just structural noise?
- Are discriminated unions used where state is modelled?

### 4. Tests
- Are the changed/added functions covered?
- Do the tests assert behaviour or implementation details?
- If a test was changed, was the behaviour change intentional and documented?

### 5. Readability & Intent
- Does the code read clearly without comments?
- Are names accurate and consistent with the domain language?
- Is there dead code, commented-out code, or debug logging?

### 6. Architecture & Scope
- Does this change belong in the layer it's in?
- Is it doing too much? Should it be split?
- Does it introduce any unwanted coupling?

## Output Format

Structure your review as:

**Summary** — one paragraph overall assessment

**Must Fix** — blocking issues (correctness, security, broken tests)

**Should Fix** — strong recommendations (FP violations, type issues, missing tests)

**Consider** — optional improvements worth discussing

**Looks Good** — what was done well (always include something genuine)

## Rules

- Be specific — reference line numbers or function names, not vague generalities
- Don't suggest rewrites for style preference alone — only flag things that matter
- If something is a personal preference vs. a real issue, label it as such
- Tone: direct and collegial, not pedantic
