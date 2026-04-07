#!/usr/bin/env bun

/**
 * ai-dev-kit install-global
 *
 * Deploys CLAUDE.md and commands/ to ~/.claude/.
 * Merge strategy: appends to existing files rather than overwriting.
 * Commands are never overwritten so hand-edits in ~/.claude/commands/ are safe.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";

// ── Types ────────────────────────────────────────────────────────────────────

type FileAction = "created" | "merged" | "skipped";

type InstallResult = {
  path: string;
  action: FileAction;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const kitRoot = resolve(import.meta.dir, "..");
const claudeHome = join(homedir(), ".claude");

// ── File strategies ───────────────────────────────────────────────────────────

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

// ── Install steps ─────────────────────────────────────────────────────────────

const installClaudeMd = (): InstallResult => {
  const src = join(kitRoot, "CLAUDE.md");
  const dest = join(claudeHome, "CLAUDE.md");
  const content = readFileSync(src, "utf-8");
  const action = appendIfMissing(dest, content, "Claude Code — Global Steering File");
  return { path: dest, action };
};

const installCommandsFromDir = (srcDir: string, destDir: string): InstallResult[] => {
  if (!existsSync(srcDir)) return [];
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".md"));

  return files.map((file) => {
    const dest = join(destDir, file);

    // Never overwrite — preserve any hand-edits in ~/.claude/commands/
    if (existsSync(dest)) return { path: dest, action: "skipped" };

    const content = readFileSync(join(srcDir, file), "utf-8");
    writeFileSync(dest, content, "utf-8");
    return { path: dest, action: "created" };
  });
};

const installCommands = (): InstallResult[] => {
  const destDir = join(claudeHome, "commands");
  const universalDir = join(kitRoot, "commands");
  const toolkitDir = join(kitRoot, "commands", "toolkit");

  // Warn if any toolkit command shares a filename with a universal command —
  // the universal copy would win silently since it deploys first.
  if (existsSync(toolkitDir) && existsSync(universalDir)) {
    const universal = new Set(readdirSync(universalDir).filter((f) => f.endsWith(".md")));
    const collisions = readdirSync(toolkitDir)
      .filter((f) => f.endsWith(".md") && universal.has(f));
    if (collisions.length > 0) {
      console.warn(`\nWarning: toolkit commands shadow universal commands and will be skipped: ${collisions.join(", ")}\n`);
    }
  }

  return [
    // Project-universal commands
    ...installCommandsFromDir(universalDir, destDir),
    // Toolkit-only commands — deployed to ~/.claude/commands/ but not to projects via init
    ...installCommandsFromDir(toolkitDir, destDir),
  ];
};

// ── Output ────────────────────────────────────────────────────────────────────

const printResults = (results: InstallResult[]): void => {
  const icon: Record<FileAction, string> = {
    created: "✓",
    merged: "⊕",
    skipped: "–",
  };

  console.log("\nInstalled:\n");
  for (const { path, action } of results) {
    console.log(`  ${icon[action]} ${path}  (${action})`);
  }

  console.log(`
Legend: ✓ created  ⊕ merged into existing  – already present, skipped
`);
};

// ── Main ──────────────────────────────────────────────────────────────────────

const main = (): void => {
  if (!existsSync(claudeHome)) mkdirSync(claudeHome, { recursive: true });

  console.log("\nai-dev-kit install-global\n");
  console.log(`Target: ${claudeHome}\n`);

  const results: InstallResult[] = [
    installClaudeMd(),
    ...installCommands(),
  ];

  printResults(results);
};

main();
