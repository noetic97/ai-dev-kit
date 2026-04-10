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
import { homedir } from "os";

// ── Constants ─────────────────────────────────────────────────────────────────

const kitRoot = resolve(import.meta.dir, "..");
const globalClaudeMdPath = join(homedir(), ".claude", "CLAUDE.md");

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

type GlobalStatus = "exists" | "installed" | "skipped";

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
  defaultValue?: string,
): Promise<string> => {
  const defaultIndex = defaultValue
    ? options.findIndex((o) => o.value === defaultValue)
    : -1;
  // If the existing value is a custom string not in the options list, default to "Other"
  const isCustomDefault = defaultValue !== undefined && defaultValue !== "" && defaultIndex === -1;
  const defaultChoice = defaultIndex >= 0
    ? String(defaultIndex + 1)
    : isCustomDefault
    ? String(options.length + 1)
    : "1";

  console.log(`\n${question}`);
  options.forEach(({ label, value }, i) => {
    const marker = value === defaultValue ? " ←" : "";
    console.log(`  ${i + 1}. ${label}${marker}`);
  });
  console.log(`  ${options.length + 1}. Other`);

  const raw = await prompt(`Choose 1–${options.length + 1}`, defaultChoice);
  const index = parseInt(raw, 10) - 1;

  if (index === options.length) return prompt("Enter custom value", defaultValue ?? "");
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

const readTemplate = (relativePath: string): string =>
  readFileSync(join(kitRoot, relativePath), "utf-8");

// ── Existing answers ──────────────────────────────────────────────────────────

// Extracts a value from a filled CLAUDE.md line like `**Name:** my-project`
const extractField = (content: string, label: string): string => {
  const match = content.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`));
  return match?.[1]?.trim().replace(/\s*<!--.*-->$/, "").trim() ?? "";
};

const readExistingAnswers = (targetDir: string): Partial<ProjectAnswers> => {
  const claudeMdPath = join(targetDir, ".claude", "CLAUDE.md");
  if (!existsSync(claudeMdPath)) return {};

  const content = readFileSync(claudeMdPath, "utf-8");
  return {
    projectName: extractField(content, "Name") || undefined,
    projectDescription: extractField(content, "Description") || undefined,
    projectType: extractField(content, "Type") || undefined,
    frontendFramework: extractField(content, "Frontend") || undefined,
    backendFramework: extractField(content, "Backend") || undefined,
    database: extractField(content, "Database") || undefined,
    testFramework: extractField(content, "Testing") || undefined,
  };
};

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

// ── Global CLAUDE.md check ────────────────────────────────────────────────────

const checkGlobalClaudeMd = async (): Promise<GlobalStatus> => {
  if (existsSync(globalClaudeMdPath)) return "exists";

  console.log("  No global CLAUDE.md found at ~/.claude/CLAUDE.md");
  console.log("  This file defines your base coding standards and is extended by every project.");
  console.log("  Without it, Claude has no global context to build on.\n");
  console.log("  Note: Claude Code itself must also be installed separately.");
  console.log("  See https://docs.anthropic.com/claude-code for setup instructions.\n");

  const answer = await prompt("Install a starter global CLAUDE.md now? (y/N)", "N");
  if (answer.toLowerCase() !== "y") return "skipped";

  const claudeDir = join(homedir(), ".claude");
  if (!existsSync(claudeDir)) mkdirSync(claudeDir, { recursive: true });

  const template = readTemplate("templates/global-claude-example.md");
  writeFileSync(globalClaudeMdPath, template, "utf-8");
  return "installed";
};

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

const globalStatusNote = (status: GlobalStatus): string => {
  if (status === "installed") {
    return `  3. Edit ${globalClaudeMdPath}
       A starter has been installed — customise it to match your preferences before your first session.`;
  }
  if (status === "skipped") {
    return `  3. Create ${globalClaudeMdPath}  ← required before using Claude Code
       A starter template is available at: ${join(kitRoot, "templates", "global-claude-example.md")}
       Copy and edit it, or write your own.
       Also ensure Claude Code is installed: https://docs.anthropic.com/claude-code`;
  }
  return `  3. Read ${globalClaudeMdPath} before filling in .claude/CLAUDE.md
       Only add overrides and project-specific context — anything defined globally does not need repeating.`;
};

const printResult = (results: ScaffoldResult[], globalStatus: GlobalStatus): void => {
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
${globalStatusNote(globalStatus)}
  4. Run \`claude\` in this directory to start a session
`);
};

// ── Main ──────────────────────────────────────────────────────────────────────

const main = async (): Promise<void> => {
  const targetDir = resolve(process.argv[2] ?? ".");

  console.log(`\nai-dev-kit init\n`);
  console.log(`Target: ${targetDir}\n`);

  const globalStatus = await checkGlobalClaudeMd();
  console.log();

  const existing = readExistingAnswers(targetDir);
  if (Object.keys(existing).length > 0) {
    console.log("Existing .claude/CLAUDE.md found — pre-filling answers. Press enter to keep.\n");
  }

  const projectName = await prompt("Project name?", existing.projectName ?? "my-project");
  const projectDescription = await prompt("One-line description?", existing.projectDescription ?? "");
  const projectType = await select("Project type?", PROJECT_TYPES, existing.projectType);

  const hasFrontend = projectType === "Frontend" || projectType === "Full-stack";
  const hasBackend = projectType === "API" || projectType === "Full-stack";

  const frontendFramework = hasFrontend
    ? await select("Frontend framework?", FRONTEND_FRAMEWORKS, existing.frontendFramework)
    : "none";

  const backendFramework = hasBackend
    ? await select("Backend framework?", BACKEND_FRAMEWORKS, existing.backendFramework)
    : "none";

  const database = await select("Database?", DATABASES, existing.database);
  const testFramework = await select("Test framework?", TEST_FRAMEWORKS, existing.testFramework);

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

  printResult(results, globalStatus);
};

main()
  .catch((err) => {
    console.error("Init failed:", err);
    process.exit(1);
  })
  .finally(() => rl.close());
