#!/usr/bin/env bun

/**
 * ai-dev-kit update
 *
 * Propagates kit changes to ~/.claude/ using stored checksums to distinguish
 * unmodified files (safe to auto-update) from locally modified ones (conflict).
 *
 * Decision logic per file:
 *   - No installed file        → create it, record checksum
 *   - Installed == kit source  → no-op (already current), skip
 *   - Installed != kit source
 *       stored hash == installed hash → unmodified, safe to overwrite → update
 *       stored hash != installed hash → locally modified → write .kit-update copy, warn
 *       no stored hash (unknown state) → treat as locally modified → write .kit-update, warn
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";
import { type Checksums, computeHash, readChecksums, withHash, writeChecksums } from "./lib/checksums";

// ── Types ─────────────────────────────────────────────────────────────────────

type UpdateAction = "created" | "updated" | "conflict" | "current";

type UpdateResult = {
  path: string;
  action: UpdateAction;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const kitRoot = resolve(import.meta.dir, "..");
const claudeHome = join(homedir(), ".claude");
const checksumsPath = join(claudeHome, ".kit-checksums");

// ── Core logic ────────────────────────────────────────────────────────────────

const updateFile = (
  srcPath: string,
  destPath: string,
  checksums: Checksums,
): { result: UpdateResult; checksums: Checksums } => {
  const srcContent = readFileSync(srcPath, "utf-8");
  const srcHash = computeHash(srcContent);

  if (!existsSync(destPath)) {
    writeFileSync(destPath, srcContent, "utf-8");
    return {
      result: { path: destPath, action: "created" },
      checksums: withHash(checksums, destPath, srcContent),
    };
  }

  const installedContent = readFileSync(destPath, "utf-8");
  const installedHash = computeHash(installedContent);

  // Already up to date
  if (installedHash === srcHash) {
    return {
      result: { path: destPath, action: "current" },
      checksums: withHash(checksums, destPath, srcContent),
    };
  }

  const storedHash = checksums[destPath];
  const isUnmodified = storedHash !== undefined && storedHash === installedHash;

  if (isUnmodified) {
    // File matches what we originally installed — safe to overwrite
    writeFileSync(destPath, srcContent, "utf-8");
    return {
      result: { path: destPath, action: "updated" },
      checksums: withHash(checksums, destPath, srcContent),
    };
  }

  // Locally modified — write kit version alongside for manual merge
  writeFileSync(`${destPath}.kit-update`, srcContent, "utf-8");
  return {
    result: { path: destPath, action: "conflict" },
    checksums, // preserve existing stored hash — user hasn't merged yet
  };
};

// ── Update steps ──────────────────────────────────────────────────────────────

const updateFilesFromDir = (
  srcDir: string,
  destDir: string,
  checksums: Checksums,
): { results: UpdateResult[]; checksums: Checksums } => {
  if (!existsSync(srcDir)) return { results: [], checksums };
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".md"));

  return files.reduce<{ results: UpdateResult[]; checksums: Checksums }>(
    (acc, file) => {
      const { result, checksums: updated } = updateFile(
        join(srcDir, file),
        join(destDir, file),
        acc.checksums,
      );
      return { results: [...acc.results, result], checksums: updated };
    },
    { results: [], checksums },
  );
};

const updateClaudeMd = (checksums: Checksums): { result: UpdateResult; checksums: Checksums } => {
  const src = join(kitRoot, "CLAUDE.md");
  const dest = join(claudeHome, "CLAUDE.md");
  return updateFile(src, dest, checksums);
};

const updateCommands = (
  checksums: Checksums,
): { results: UpdateResult[]; checksums: Checksums } => {
  const destDir = join(claudeHome, "commands");
  const universalDir = join(kitRoot, "commands");
  const toolkitDir = join(kitRoot, "commands", "toolkit");

  const universal = updateFilesFromDir(universalDir, destDir, checksums);
  const toolkit = updateFilesFromDir(toolkitDir, destDir, universal.checksums);

  return {
    results: [...universal.results, ...toolkit.results],
    checksums: toolkit.checksums,
  };
};

// ── Output ────────────────────────────────────────────────────────────────────

const printResults = (results: UpdateResult[]): void => {
  const icon: Record<UpdateAction, string> = {
    created: "✓",
    updated: "↑",
    conflict: "!",
    current: "–",
  };

  console.log("\nUpdated:\n");
  for (const { path, action } of results) {
    console.log(`  ${icon[action]} ${path}  (${action})`);
  }

  const conflicts = results.filter((r) => r.action === "conflict");
  if (conflicts.length > 0) {
    console.log(`
⚠  ${conflicts.length} file(s) have local modifications. Kit versions written as .kit-update:
${conflicts.map((r) => `     ${r.path}.kit-update`).join("\n")}

   Review the .kit-update files and merge changes manually, then delete them.
`);
  }

  console.log(`Legend: ✓ created  ↑ updated  ! conflict (see .kit-update)  – already current\n`);
};

// ── Main ──────────────────────────────────────────────────────────────────────

const main = (): void => {
  if (!existsSync(claudeHome)) mkdirSync(claudeHome, { recursive: true });

  console.log("\nai-dev-kit update\n");
  console.log(`Target: ${claudeHome}\n`);

  const initialChecksums = readChecksums(checksumsPath);

  const { result: claudeMdResult, checksums: afterClaudeMd } = updateClaudeMd(initialChecksums);
  const { results: commandResults, checksums: final } = updateCommands(afterClaudeMd);

  const allResults = [claudeMdResult, ...commandResults];
  printResults(allResults);
  writeChecksums(checksumsPath, final);
};

main();
