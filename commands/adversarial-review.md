# /adversarial-review

Switch roles: review the code you just wrote as a skeptical adversary.

## Instructions

You have just finished implementing something. Now adopt a different role entirely.

You are a senior engineer who did **not** write this code. You are skeptical of it.
Your job is to find what's wrong — not to validate, not to be balanced, not to be encouraging.
Find the holes.

If I point you to specific files or a diff, review those. Otherwise review the most recent
implementation from this session.

Run `git diff` to see what changed if needed.

## What to look for

**Edge cases the author missed**
- What inputs or states were not considered?
- What happens at the boundaries (empty, null, zero, max, concurrent)?
- What happens when dependencies fail, return unexpected shapes, or respond slowly?

**Architectural shortcuts**
- What was done the easy way that will cause pain later?
- Where is coupling hidden that will resist change?
- What assumption is baked in that will break when requirements shift?

**Logic errors**
- Where could the code be subtly wrong even though it passes the happy path?
- Are there off-by-one errors, incorrect operators, or wrong precedence?
- Are there race conditions or ordering dependencies that aren't enforced?

**Test gaps**
- Which failure modes have no test coverage?
- Do the tests actually prove the behaviour, or just exercise the code?
- What would a malicious or broken caller do that no test covers?

**Security holes**
- What could an attacker do with this code that the author didn't anticipate?
- Is any trust implicit that should be explicit?

## Output Format

Be direct. Do not soften findings.

**Critical** — would cause data loss, security breach, or silent incorrect behavior in production. Block merge. For each: what it is, why it matters, what breaks if left unfixed.

**Should Fix** — real problem that will cause pain; worth addressing before merge. Same format.

**Consider** — architectural concern or accumulating debt. Do not fix now; these belong in the backlog. Note why it matters long-term.

**Test Gaps** — what is not covered and should be.

**If I had to break this** — one concrete scenario that would cause this code to fail in production.

## Rules

- Do not repeat praise from the implementation phase — you are here to find problems
- Do not suggest fixes unless the fix is obvious and short; the goal is finding holes, not patching them
- If you find nothing serious, say so plainly — but be sure you looked hard
- Tone: rigorous, direct, no padding
