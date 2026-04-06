# /new-module

Scaffold a new TypeScript module following project conventions.

## Instructions

Ask me for the following if not already provided:
1. **Module name** — what is this module called? (e.g. `payment-processor`, `user-profile`)
2. **Purpose** — one sentence: what does this module do?
3. **Inputs/outputs** — what data goes in, what comes out?
4. **Dependencies** — does it need access to the DB, an external API, other modules?

Once you have this, produce a plan showing:
- The files you will create and their paths
- The exported functions and their type signatures
- Any types/interfaces that need to be defined

Wait for my approval before writing any code.

## Output Structure

Follow the project's architecture as defined in CLAUDE.md. Default structure if not specified:

```
src/
  {{module-name}}/
    index.ts          ← public API, re-exports only
    {{module-name}}.ts       ← core logic (pure functions)
    {{module-name}}.test.ts  ← unit tests
    types.ts          ← types scoped to this module
```

## Rules

- All functions must be pure unless the module is explicitly an infrastructure adapter
- Export only what consumers need — keep internals unexported
- Write tests alongside the implementation, not after
- No classes
- index.ts is a barrel file only — no logic lives there
