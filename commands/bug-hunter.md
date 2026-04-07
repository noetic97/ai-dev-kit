# /bug-hunter

Systematic bug investigation. Make the code observable first, then fix with evidence.

## Instructions

This command works in three phases: **Understand** → **Instrument** → **Fix**.
Do not attempt to fix anything until you have log evidence of what is actually happening.

---

## Phase 1 — Understand

Ask me to describe the buggy behavior. Then ask clarifying questions to narrow the search
space before touching any code:

- What is the expected behavior? What is the actual behavior?
- Is this consistently reproducible, or intermittent?
- When did it start? Was anything changed recently?
- What inputs or conditions trigger it?
- Has this ever worked correctly?
- Are there any error messages, stack traces, or console output already visible?

Do not ask all of these — ask only the ones that would meaningfully change where you look.
Stop when you have a clear enough picture to instrument the suspected code path.

---

## Phase 2 — Instrument

Before touching any logic, add temporary debug logging to make the code flow visible.

**Instrument at these points:**
- Entry to any function in the suspected path (log inputs)
- Decision points: conditionals, early returns, branching logic (log which branch was taken)
- Data transformations (log before and after)
- Boundaries: I/O operations, external calls, database queries (log request and response)
- Exit points (log what is being returned)

**Logging rules:**
- Prefix all debug logs with `[bug-hunter]` so they are easy to find and remove later
- Log the actual values, not just "reached here" — the data is what matters
- Keep instrumentation minimal — only the suspected path, not the whole codebase

Present the instrumented code and ask me to run it and share the output. Do not proceed
to fixing until I provide log output or confirm what the logs showed.

---

## Phase 3 — Hypothesize

Based on the log output, form explicit hypotheses before fixing:

- State what the logs reveal about where the behavior diverges from expectation
- Identify the root cause (not just the symptom)
- If multiple hypotheses are plausible, rank them by likelihood and state why

Confirm the hypothesis with me before writing a fix.

---

## Phase 4 — Fix

Fix the root cause, not the symptom. For each change:
- State what you are changing and why the log evidence points here
- Keep the fix minimal — do not refactor surrounding code unless it is directly causing the bug
- If the fix requires a larger change, surface that explicitly rather than silently expanding scope

---

## Phase 5 — Clean up

After the fix is confirmed:
1. Remove all `[bug-hunter]` debug logs
2. Write a regression test that would have caught this bug
3. Note in `.claude/CONTEXT.md` under Known Gotchas if this reveals a systemic issue
