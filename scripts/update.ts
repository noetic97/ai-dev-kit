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

import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, statSync, unlinkSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";
import { checksumsPath, type Checksums, computeHash, readChecksums, withHash, withoutHash, writeChecksums } from "./lib/checksums";

// ── Types ─────────────────────────────────────────────────────────────────────

type UpdateAction = "created" | "updated" | "conflict" | "current" | "removed";

type UpdateResult = {
  path: string;
  action: UpdateAction;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const kitRoot = resolve(import.meta.dir, "..");
const claudeHome = join(homedir(), ".claude");

// ── Core logic ────────────────────────────────────────────────────────────────

const updateFile = (
  srcPath: string,
  destPath: string,
  checksums: Checksums,
  executable = false,
): { result: UpdateResult; checksums: Checksums } => {
  const srcContent = readFileSync(srcPath, "utf-8");
  const srcHash = computeHash(srcContent);

  if (!existsSync(destPath)) {
    writeFileSync(destPath, srcContent, "utf-8");
    if (executable) chmodSync(destPath, 0o755);
    return {
      result: { path: destPath, action: "created" },
      checksums: withHash(checksums, destPath, srcContent),
    };
  }

  const installedContent = readFileSync(destPath, "utf-8");
  const installedHash = computeHash(installedContent);

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
    writeFileSync(destPath, srcContent, "utf-8");
    if (executable) chmodSync(destPath, 0o755);
    return {
      result: { path: destPath, action: "updated" },
      checksums: withHash(checksums, destPath, srcContent),
    };
  }

  writeFileSync(`${destPath}.kit-update`, srcContent, "utf-8");
  return {
    result: { path: destPath, action: "conflict" },
    checksums,
  };
};

// ── Update steps ──────────────────────────────────────────────────────────────

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
  const normalize = (s: string): string => s.replace(/\r\n/g, "\n");

  if (normalize(installedContent).includes(normalize(srcContent))) {
    const kitUpdatePath = `${dest}.kit-update`;
    if (existsSync(kitUpdatePath)) unlinkSync(kitUpdatePath);
    return {
      result: { path: dest, action: "current" },
      checksums: withHash(checksums, dest, installedContent),
    };
  }

  writeFileSync(`${dest}.kit-update`, srcContent, "utf-8");
  return {
    result: { path: dest, action: "conflict" },
    checksums,
  };
};

const updateSkillDir = (
  srcSkillDir: string,
  destSkillDir: string,
  checksums: Checksums,
): { results: UpdateResult[]; checksums: Checksums } => {
  if (!existsSync(destSkillDir)) mkdirSync(destSkillDir, { recursive: true });

  return readdirSync(srcSkillDir)
    .filter((f) => !statSync(join(srcSkillDir, f)).isDirectory())
    .reduce<{ results: UpdateResult[]; checksums: Checksums }>(
      (acc, file) => {
        const { result, checksums: updated } = updateFile(
          join(srcSkillDir, file),
          join(destSkillDir, file),
          acc.checksums,
        );
        return { results: [...acc.results, result], checksums: updated };
      },
      { results: [], checksums },
    );
};

const updateSkills = (
  checksums: Checksums,
): { results: UpdateResult[]; checksums: Checksums } => {
  const srcDir = join(kitRoot, "skills");
  const destDir = join(claudeHome, "skills");
  if (!existsSync(srcDir)) return { results: [], checksums };
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

  return readdirSync(srcDir)
    .filter((entry) => statSync(join(srcDir, entry)).isDirectory())
    .reduce<{ results: UpdateResult[]; checksums: Checksums }>(
      (acc, entry) => {
        const { results, checksums: updated } = updateSkillDir(
          join(srcDir, entry),
          join(destDir, entry),
          acc.checksums,
        );
        return { results: [...acc.results, ...results], checksums: updated };
      },
      { results: [], checksums },
    );
};

const updateFlatFiles = (
  srcDir: string,
  destDir: string,
  ext: string,
  checksums: Checksums,
  executable = false,
): { results: UpdateResult[]; checksums: Checksums } => {
  if (!existsSync(srcDir)) return { results: [], checksums };
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

  return readdirSync(srcDir)
    .filter((f) => f.endsWith(ext))
    .reduce<{ results: UpdateResult[]; checksums: Checksums }>(
      (acc, file) => {
        const { result, checksums: updated } = updateFile(
          join(srcDir, file),
          join(destDir, file),
          acc.checksums,
          executable,
        );
        return { results: [...acc.results, result], checksums: updated };
      },
      { results: [], checksums },
    );
};

const updateAgents = (
  checksums: Checksums,
): { results: UpdateResult[]; checksums: Checksums } =>
  updateFlatFiles(join(kitRoot, "agents"), join(claudeHome, "agents"), ".md", checksums);

const updateHooks = (
  checksums: Checksums,
): { results: UpdateResult[]; checksums: Checksums } =>
  updateFlatFiles(join(kitRoot, "hooks"), join(claudeHome, "hooks"), ".sh", checksums, true);

// ── Stale removal ─────────────────────────────────────────────────────────────

// Removes kit-deployed files that no longer exist in the source directory.
// Only removes files that are tracked in checksums — hand-added files are safe.

const removeStaleFiles = (
  srcDir: string,
  destDir: string,
  checksums: Checksums,
): { results: UpdateResult[]; checksums: Checksums } => {
  if (!existsSync(destDir)) return { results: [], checksums };

  const srcFiles = existsSync(srcDir) ? new Set(readdirSync(srcDir)) : new Set<string>();

  return readdirSync(destDir)
    .filter((f) => !statSync(join(destDir, f)).isDirectory())
    .reduce<{ results: UpdateResult[]; checksums: Checksums }>(
      (acc, file) => {
        const destPath = join(destDir, file);
        if (srcFiles.has(file) || !acc.checksums[destPath]) return acc;

        unlinkSync(destPath);
        return {
          results: [...acc.results, { path: destPath, action: "removed" }],
          checksums: withoutHash(acc.checksums, destPath),
        };
      },
      { results: [], checksums },
    );
};

const removeStaleSkills = (
  checksums: Checksums,
): { results: UpdateResult[]; checksums: Checksums } => {
  const srcDir = join(kitRoot, "skills");
  const destDir = join(claudeHome, "skills");
  if (!existsSync(destDir)) return { results: [], checksums };

  const srcSkills = existsSync(srcDir) ? new Set(readdirSync(srcDir)) : new Set<string>();

  return readdirSync(destDir)
    .filter((entry) => statSync(join(destDir, entry)).isDirectory())
    .reduce<{ results: UpdateResult[]; checksums: Checksums }>(
      (acc, skillName) => {
        const srcSkillDir = join(srcDir, skillName);
        const destSkillDir = join(destDir, skillName);

        const { results, checksums: updated } = removeStaleFiles(
          srcSkills.has(skillName) ? srcSkillDir : "",
          destSkillDir,
          acc.checksums,
        );

        // Prune empty skill directory
        if (existsSync(destSkillDir) && readdirSync(destSkillDir).length === 0) {
          rmdirSync(destSkillDir);
        }

        return { results: [...acc.results, ...results], checksums: updated };
      },
      { results: [], checksums },
    );
};

const removeStaleAgents = (
  checksums: Checksums,
): { results: UpdateResult[]; checksums: Checksums } =>
  removeStaleFiles(join(kitRoot, "agents"), join(claudeHome, "agents"), checksums);

const removeStaleHooks = (
  checksums: Checksums,
): { results: UpdateResult[]; checksums: Checksums } =>
  removeStaleFiles(join(kitRoot, "hooks"), join(claudeHome, "hooks"), checksums);

// ── Output ────────────────────────────────────────────────────────────────────

const printResults = (results: UpdateResult[]): void => {
  const icon: Record<UpdateAction, string> = {
    created: "✓",
    updated: "↑",
    conflict: "!",
    current: "–",
    removed: "✕",
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

  console.log(`Legend: ✓ created  ↑ updated  ! conflict (see .kit-update)  – already current  ✕ removed\n`);
};

// ── Main ──────────────────────────────────────────────────────────────────────

const main = (): void => {
  if (!existsSync(claudeHome)) mkdirSync(claudeHome, { recursive: true });

  console.log("\nai-dev-kit update\n");
  console.log(`Target: ${claudeHome}\n`);

  const initial = readChecksums(checksumsPath);

  const { result: claudeMdResult, checksums: afterClaudeMd } = updateClaudeMd(initial);
  const { results: skillResults, checksums: afterSkills } = updateSkills(afterClaudeMd);
  const { results: agentResults, checksums: afterAgents } = updateAgents(afterSkills);
  const { results: hookResults, checksums: afterHooks } = updateHooks(afterAgents);

  // Remove stale files after all updates — ensures removals only happen for files
  // that were genuinely deleted from source, not ones that just weren't updated yet.
  const { results: staleSkillResults, checksums: afterStaleSkills } = removeStaleSkills(afterHooks);
  const { results: staleAgentResults, checksums: afterStaleAgents } = removeStaleAgents(afterStaleSkills);
  const { results: staleHookResults, checksums: final } = removeStaleHooks(afterStaleAgents);

  const allResults = [
    claudeMdResult,
    ...skillResults, ...agentResults, ...hookResults,
    ...staleSkillResults, ...staleAgentResults, ...staleHookResults,
  ];
  printResults(allResults);
  writeChecksums(checksumsPath, final);
};

main();
