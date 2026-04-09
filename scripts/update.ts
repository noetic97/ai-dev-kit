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

import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
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

  // Already up to date — clean up any stale .kit-update from a previously resolved conflict
  if (installedHash === srcHash) {
    const kitUpdatePath = `${destPath}.kit-update`;
    if (existsSync(kitUpdatePath)) unlinkSync(kitUpdatePath);
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

// CLAUDE.md is deployed via appendIfMissing — the installed file may contain user
// content prepended to the kit section. Never auto-overwrite. Instead check whether
// the installed file already contains the current kit source as a substring (current),
// or write .kit-update for manual review (conflict).
const updateClaudeMd = (checksums: Checksums): { result: UpdateResult; checksums: Checksums } => {
  const src = join(kitRoot, "CLAUDE.md");
  const dest = join(claudeHome, "CLAUDE.md");
  const srcContent = readFileSync(src, "utf-8");

  if (!existsSync(dest)) {
    writeFileSync(dest, srcContent, "utf-8");
    return {
      result: { path: dest, action: "created" },
      checksums: withHash(checksums, dest, srcContent),
    };
  }

  const installedContent = readFileSync(dest, "utf-8");

  // Kit section is present and current — nothing to do
  if (installedContent.includes(srcContent)) {
    const kitUpdatePath = `${dest}.kit-update`;
    if (existsSync(kitUpdatePath)) unlinkSync(kitUpdatePath);
    return {
      result: { path: dest, action: "current" },
      checksums: withHash(checksums, dest, installedContent),
    };
  }

  // Kit source has changed — write .kit-update for manual merge.
  // We never auto-overwrite CLAUDE.md since the installed copy may have a user prefix.
  writeFileSync(`${dest}.kit-update`, srcContent, "utf-8");
  return {
    result: { path: dest, action: "conflict" },
    checksums,
  };
};

const updateCommands = (
  checksums: Checksums,
): { results: UpdateResult[]; checksums: Checksums } => {
  const destDir = join(claudeHome, "commands");
  const universalDir = join(kitRoot, "commands");
  const toolkitDir = join(kitRoot, "commands", "toolkit");

  // Warn if a toolkit command shares a filename with a universal command —
  // the universal copy deploys first so the toolkit version would silently overwrite it.
  if (existsSync(toolkitDir) && existsSync(universalDir)) {
    const universal = new Set(readdirSync(universalDir).filter((f) => f.endsWith(".md")));
    const collisions = readdirSync(toolkitDir).filter((f) => f.endsWith(".md") && universal.has(f));
    if (collisions.length > 0) {
      console.warn(`\nWarning: toolkit commands shadow universal commands and will be skipped: ${collisions.join(", ")}\n`);
    }
  }

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
