#!/usr/bin/env bun

/**
 * ai-dev-kit init
 *
 * Scaffolds Claude Code steering files into a target project.
 * Merge strategy: appends to existing files rather than overwriting.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";
import { join, resolve } from "path";

// ── Types ────────────────────────────────────────────────────────────────────

type ProjectAnswers = {
  projectName: string;
  projectDescription: string;
  projectType: string;
  frontendFramework: string;
  backendFramework: string;
  database: string;
  testFramework: string;
};

type SelectOption = {
  readonly label: string;
  readonly value: string;
};

type FileAction = "created" | "merged" | "skipped";

type ScaffoldResult = {
  path: string;
  action: FileAction;
};

// ── Prompt helpers ───────────────────────────────────────────────────────────

// Single readline interface shared across all prompts — creating a new iterator
// per call (e.g. `for await (const line of console)`) abandons stdin mid-stream.
const rl = createInterface({ input: process.stdin, output: process.stdout });

const prompt = (question: string, fallback = ""): Promise<string> =>
  new Promise((resolve) => {
    rl.question(`${question} ${fallback ? `(${fallback}) ` : ""}> `, (answer) => {
      resolve(answer.trim() || fallback);
    });
  });

const select = async (
  question: string,
  options: ReadonlyArray<SelectOption>,
): Promise<string> => {
  console.log(`\n${question}`);
  options.forEach(({ label }, i) => console.log(`  ${i + 1}. ${label}`));
  console.log(`  ${options.length + 1}. Other`);

  const raw = await prompt(`Choose 1–${options.length + 1}`, "1");
  const index = parseInt(raw, 10) - 1;

  if (index === options.length) return prompt("Enter custom value");
  return options[Math.max(0, Math.min(index, options.length - 1))]?.value ?? options[0].value;
};

// ── Option lists ──────────────────────────────────────────────────────────────

const PROJECT_TYPES = [
  { label: "API", value: "API" },
  { label: "CLI", value: "CLI" },
  { label: "Frontend", value: "Frontend" },
  { label: "Full-stack", value: "Full-stack" },
  { label: "Library", value: "Library" },
] as const satisfies ReadonlyArray<SelectOption>;

const FRONTEND_FRAMEWORKS = [
  { label: "React", value: "React" },
  { label: "Preact", value: "Preact" },
  { label: "Vue", value: "Vue" },
  { label: "Svelte", value: "Svelte" },
  { label: "None", value: "none" },
] as const satisfies ReadonlyArray<SelectOption>;

const BACKEND_FRAMEWORKS = [
  { label: "Hono", value: "Hono" },
  { label: "Elysia", value: "Elysia" },
  { label: "Express", value: "Express" },
  { label: "None", value: "none" },
] as const satisfies ReadonlyArray<SelectOption>;

const DATABASES = [
  { label: "PostgreSQL", value: "PostgreSQL" },
  { label: "SQLite", value: "SQLite" },
  { label: "MySQL", value: "MySQL" },
  { label: "None", value: "none" },
] as const satisfies ReadonlyArray<SelectOption>;

const TEST_FRAMEWORKS = [
  { label: "Bun test", value: "Bun test" },
  { label: "Vitest", value: "Vitest" },
  { label: "Jest", value: "Jest" },
  { label: "None", value: "none" },
] as const satisfies ReadonlyArray<SelectOption>;

const kitRoot = resolve(import.meta.dir, "..");

const readTemplate = (relativePath: string): string =>
  readFileSync(join(kitRoot, relativePath), "utf-8");

// ── File write strategies ─────────────────────────────────────────────────────

const writeNew = (path: string, content: string): FileAction => {
  writeFileSync(path, content, "utf-8");
  return "created";
};

const appendIfMissing = (
  path: string,
  content: string,
  marker: string,
): FileAction => {
  if (!existsSync(path)) return writeNew(path, content);

  const existing = readFileSync(path, "utf-8");
  if (existing.includes(marker)) return "skipped";

  writeFileSync(path, `${existing}\n\n${content}`, "utf-8");
  return "merged";
};

// ── Token replacement ─────────────────────────────────────────────────────────

const fillTemplate = (template: string, answers: ProjectAnswers): string =>
  template
    .replace(/\{\{PROJECT_NAME\}\}/g, answers.projectName)
    .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, answers.projectDescription)
    .replace(/\{\{PROJECT_TYPE\}\}/g, answers.projectType)
    .replace(/\{\{FRONTEND_FRAMEWORK\}\}/g, answers.frontendFramework)
    .replace(/\{\{BACKEND_FRAMEWORK\}\}/g, answers.backendFramework)
    .replace(/\{\{DATABASE\}\}/g, answers.database || "none")
    .replace(/\{\{TEST_FRAMEWORK\}\}/g, answers.testFramework || "Bun test")
    .replace(/\{\{OTHER_DEPS\}\}/g, "TBD")
    .replace(
      /\{\{ARCHITECTURE_DESCRIPTION\}\}/g,
      "<!-- TODO: describe your architecture -->",
    )
    .replace(/\{\{DOMAIN_GLOSSARY\}\}/g, "<!-- TODO: define domain terms -->")
    .replace(/\{\{KEY_TYPES\}\}/g, "<!-- TODO: paste key types here -->")
    .replace(
      /\{\{INTEGRATIONS\}\}/g,
      "<!-- TODO: list external integrations -->",
    )
    .replace(
      /\{\{PROJECT_CONVENTIONS\}\}/g,
      "<!-- TODO: note any exceptions to global CLAUDE.md -->",
    )
    .replace(
      /\{\{OTHER_OFF_LIMITS\}\}/g,
      "<!-- TODO: add any other protected paths -->",
    );

// ── Scaffold steps ────────────────────────────────────────────────────────────

const scaffoldClaudeMd = (
  targetDir: string,
  answers: ProjectAnswers,
): ScaffoldResult => {
  const claudeDir = join(targetDir, ".claude");
  if (!existsSync(claudeDir)) mkdirSync(claudeDir, { recursive: true });

  const destPath = join(claudeDir, "CLAUDE.md");
  const template = readTemplate("templates/project-claude.md");
  const filled = fillTemplate(template, answers);

  const action = appendIfMissing(
    destPath,
    filled,
    "Claude Code — Project Steering File",
  );

  return { path: destPath, action };
};

const scaffoldCommands = (targetDir: string): ScaffoldResult[] => {
  const srcDir = join(kitRoot, "commands");
  const commandsDir = join(targetDir, ".claude", "commands");
  if (!existsSync(commandsDir)) mkdirSync(commandsDir, { recursive: true });

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".md"));

  return files.map((file) => {
    const destPath = join(commandsDir, file);
    if (existsSync(destPath)) return { path: destPath, action: "skipped" };

    const content = readTemplate(`commands/${file}`);
    writeFileSync(destPath, content, "utf-8");
    return { path: destPath, action: "created" };
  });
};

const scaffoldClaudeIgnore = (targetDir: string): ScaffoldResult => {
  const destPath = join(targetDir, ".claudeignore");
  const content = readTemplate("templates/claudeignore");
  const action = appendIfMissing(destPath, content, "node_modules/");
  return { path: destPath, action };
};

const scaffoldContextMd = (
  targetDir: string,
  answers: ProjectAnswers,
): ScaffoldResult => {
  const claudeDir = join(targetDir, ".claude");
  if (!existsSync(claudeDir)) mkdirSync(claudeDir, { recursive: true });

  const destPath = join(claudeDir, "CONTEXT.md");

  // Never overwrite — context is hand-maintained, never generated
  if (existsSync(destPath)) return { path: destPath, action: "skipped" };

  const template = readTemplate("templates/context.md");
  const filled = template
    .replace(/\{\{PROJECT_NAME\}\}/g, answers.projectName)
    .replace(
      /\{\{CURRENT_FOCUS\}\}/g,
      "<!-- TODO: describe what you are actively working on -->",
    );

  writeFileSync(destPath, filled, "utf-8");
  return { path: destPath, action: "created" };
};

// ── Output ────────────────────────────────────────────────────────────────────

const printResult = (results: ScaffoldResult[]): void => {
  const icon: Record<FileAction, string> = {
    created: "✓",
    merged: "⊕",
    skipped: "–",
  };

  console.log("\nScaffolded:\n");
  for (const { path, action } of results) {
    const rel = path.replace(process.cwd() + "/", "");
    console.log(`  ${icon[action]} ${rel}  (${action})`);
  }

  console.log(`
Legend: ✓ created  ⊕ merged into existing  – already present, skipped

Next steps:
  1. Fill in the TODOs in .claude/CLAUDE.md
  2. Update .claude/CONTEXT.md with your current focus
  3. Add your global base to ~/.claude/CLAUDE.md if not already there
  4. Run \`claude\` in this directory to start a session
`);
};

// ── Main ──────────────────────────────────────────────────────────────────────

const main = async (): Promise<void> => {
  const targetDir = resolve(process.argv[2] ?? ".");

  console.log(`\nai-dev-kit init\n`);
  console.log(`Target: ${targetDir}\n`);

  const projectName = await prompt("Project name?", "my-project");
  const projectDescription = await prompt("One-line description?", "");
  const projectType = await select("Project type?", PROJECT_TYPES);

  const hasFrontend = projectType === "Frontend" || projectType === "Full-stack";
  const hasBackend = projectType === "API" || projectType === "Full-stack";

  const frontendFramework = hasFrontend
    ? await select("Frontend framework?", FRONTEND_FRAMEWORKS)
    : "none";

  const backendFramework = hasBackend
    ? await select("Backend framework?", BACKEND_FRAMEWORKS)
    : "none";

  const database = await select("Database?", DATABASES);
  const testFramework = await select("Test framework?", TEST_FRAMEWORKS);

  const answers: ProjectAnswers = {
    projectName,
    projectDescription,
    projectType,
    frontendFramework,
    backendFramework,
    database,
    testFramework,
  };

  const results: ScaffoldResult[] = [
    scaffoldClaudeMd(targetDir, answers),
    scaffoldContextMd(targetDir, answers),
    scaffoldClaudeIgnore(targetDir),
    ...scaffoldCommands(targetDir),
  ];

  printResult(results);
};

main()
  .catch((err) => {
    console.error("Init failed:", err);
    process.exit(1);
  })
  .finally(() => rl.close());
