#!/usr/bin/env bun

/**
 * ai-dev-kit install-global
 *
 * Deploys CLAUDE.md and commands/ to ~/.claude/.
 * Merge strategy: appends to existing files rather than overwriting.
 * Commands are never overwritten so hand-edits in ~/.claude/commands/ are safe.
 *
 * Records SHA256 checksums of every deployed file in ~/.claude/.kit-checksums
 * so that `scripts/update.ts` can later distinguish unmodified files (safe to
 * auto-update) from locally modified ones (write .kit-update copy instead).
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";
import { checksumsPath, type Checksums, computeHash, readChecksums, withHash, writeChecksums } from "./lib/checksums";

// ── Types ────────────────────────────────────────────────────────────────────

type FileAction = "created" | "merged" | "skipped";

type InstallResult = {
  path: string;
  action: FileAction;
  content: string; // retained so we can checksum what was actually written
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

// Returns the content to checksum — always what's actually on disk after install.
// "created" is the only case where we wrote exactly srcContent; "merged" and "skipped"
// both result in files that differ from srcContent so we read them back.
const contentToChecksum = (path: string, srcContent: string, action: FileAction): string => {
  if (action === "created") return srcContent;
  return readFileSync(path, "utf-8");
};

// ── Install steps ─────────────────────────────────────────────────────────────

const installClaudeMd = (): InstallResult => {
  const src = join(kitRoot, "CLAUDE.md");
  const dest = join(claudeHome, "CLAUDE.md");
  const content = readFileSync(src, "utf-8");
  const action = appendIfMissing(dest, content, "Claude Code — Global Steering File");
  return { path: dest, action, content: contentToChecksum(dest, content, action) };
};

const installCommandsFromDir = (srcDir: string, destDir: string): InstallResult[] => {
  if (!existsSync(srcDir)) return [];
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".md"));

  return files.map((file) => {
    const dest = join(destDir, file);
    const content = readFileSync(join(srcDir, file), "utf-8");

    // Never overwrite — preserve any hand-edits in ~/.claude/commands/
    if (existsSync(dest)) return { path: dest, action: "skipped", content: contentToChecksum(dest, content, "skipped") };

    writeFileSync(dest, content, "utf-8");
    return { path: dest, action: "created", content };
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

const recordChecksums = (results: InstallResult[]): void => {
  const existing = readChecksums(checksumsPath);
  const updated = results.reduce<Checksums>(
    (acc, { path, content }) => withHash(acc, path, content),
    existing,
  );
  writeChecksums(checksumsPath, updated);
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
  recordChecksums(results);
};

main();
