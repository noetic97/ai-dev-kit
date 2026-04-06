#!/usr/bin/env bun

/**
 * ai-dev-kit init
 *
 * Scaffolds Claude Code steering files into a target project.
 * Merge strategy: appends to existing files rather than overwriting.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

// ── Types ────────────────────────────────────────────────────────────────────

type ProjectAnswers = {
  projectName: string;
  projectDescription: string;
  projectType: string;
  framework: string;
  database: string;
  testFramework: string;
};

type FileAction = "created" | "merged" | "skipped";

type ScaffoldResult = {
  path: string;
  action: FileAction;
};

// ── Prompt helpers ───────────────────────────────────────────────────────────

const prompt = async (question: string, fallback = ""): Promise<string> => {
  process.stdout.write(`${question} ${fallback ? `(${fallback}) ` : ""}> `);
  for await (const line of console) {
    return line.trim() || fallback;
  }
  return fallback;
};

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
    .replace(/\{\{FRAMEWORK\}\}/g, answers.framework || "none")
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
  const commandsDir = join(targetDir, ".claude", "commands");
  if (!existsSync(commandsDir)) mkdirSync(commandsDir, { recursive: true });

  const commandFiles = ["new-module.md", "adr.md", "code-review.md"];

  return commandFiles.map((file) => {
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

  const answers: ProjectAnswers = {
    projectName: await prompt("Project name?", "my-project"),
    projectDescription: await prompt("One-line description?", ""),
    projectType: await prompt(
      "Project type? (API / CLI / full-stack / library)",
      "API",
    ),
    framework: await prompt(
      "Framework? (Hono / Next.js / Elysia / none)",
      "none",
    ),
    database: await prompt("Database? (PostgreSQL / SQLite / none)", "none"),
    testFramework: await prompt("Test framework?", "Bun test"),
  };

  const results: ScaffoldResult[] = [
    scaffoldClaudeMd(targetDir, answers),
    scaffoldContextMd(targetDir, answers),
    scaffoldClaudeIgnore(targetDir),
    ...scaffoldCommands(targetDir),
  ];

  printResult(results);
};

main().catch((err) => {
  console.error("Init failed:", err);
  process.exit(1);
});
