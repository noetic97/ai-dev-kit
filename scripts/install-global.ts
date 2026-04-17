#!/usr/bin/env bun

/**
 * ai-dev-kit install-global
 *
 * Deploys CLAUDE.md, skills/, agents/, and hooks/ to ~/.claude/.
 *
 * Deployment model:
 *   skills/   → ~/.claude/skills/   (all skills, including scope: global)
 *   agents/   → ~/.claude/agents/
 *   hooks/    → ~/.claude/hooks/
 *   CLAUDE.md → ~/.claude/CLAUDE.md (append-if-missing)
 *
 * Skills are directories — every file inside each skill dir is copied.
 * Existing files are never overwritten (preserves hand-edits in ~/.claude/).
 *
 * Records SHA256 checksums of every deployed file in ~/.claude/.kit-checksums
 * so that `scripts/update.ts` can later distinguish unmodified files (safe to
 * auto-update) from locally modified ones (write .kit-update copy instead).
 */

import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";
import { checksumsPath, type Checksums, readChecksums, withHash, writeChecksums } from "./lib/checksums";

// ── Types ─────────────────────────────────────────────────────────────────────

type FileAction = "created" | "skipped";

type InstallResult = {
  path: string;
  action: FileAction;
  content: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const kitRoot = resolve(import.meta.dir, "..");
const claudeHome = join(homedir(), ".claude");

// ── File strategies ───────────────────────────────────────────────────────────

const writeNew = (path: string, content: string): FileAction => {
  writeFileSync(path, content, "utf-8");
  return "created";
};

const appendIfMissing = (path: string, content: string, marker: string): FileAction => {
  if (!existsSync(path)) return writeNew(path, content);
  const existing = readFileSync(path, "utf-8");
  if (existing.includes(marker)) return "skipped";
  writeFileSync(path, `${existing}\n\n${content}`, "utf-8");
  return "created"; // treated as a write for checksum purposes
};

const contentOnDisk = (path: string, srcContent: string, action: FileAction): string =>
  action === "created" ? srcContent : readFileSync(path, "utf-8");

// ── Install steps ─────────────────────────────────────────────────────────────

const installClaudeMd = (): InstallResult => {
  const src = join(kitRoot, "CLAUDE.md");
  const dest = join(claudeHome, "CLAUDE.md");
  const content = readFileSync(src, "utf-8");
  const action = appendIfMissing(dest, content, "ai-dev-kit:global:");
  return { path: dest, action, content: contentOnDisk(dest, content, action) };
};

// Copies every file in a skill directory to the dest skill directory.
// Never overwrites — preserves hand-edits.
const installSkillDir = (
  skillName: string,
  srcSkillDir: string,
  destSkillDir: string,
): InstallResult[] => {
  if (!existsSync(destSkillDir)) mkdirSync(destSkillDir, { recursive: true });

  return readdirSync(srcSkillDir).flatMap((file) => {
    const srcPath = join(srcSkillDir, file);
    if (statSync(srcPath).isDirectory()) return [];

    const destPath = join(destSkillDir, file);
    const content = readFileSync(srcPath, "utf-8");

    if (existsSync(destPath)) {
      return [{ path: destPath, action: "skipped" as FileAction, content: readFileSync(destPath, "utf-8") }];
    }

    writeFileSync(destPath, content, "utf-8");
    return [{ path: destPath, action: "created" as FileAction, content }];
  });
};

const installSkills = (): InstallResult[] => {
  const srcDir = join(kitRoot, "skills");
  const destDir = join(claudeHome, "skills");
  if (!existsSync(srcDir)) return [];
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

  return readdirSync(srcDir).flatMap((entry) => {
    const srcSkillDir = join(srcDir, entry);
    if (!statSync(srcSkillDir).isDirectory()) return [];
    return installSkillDir(entry, srcSkillDir, join(destDir, entry));
  });
};

const installFlatFiles = (
  srcDir: string,
  destDir: string,
  ext: string,
  executable = false,
): InstallResult[] => {
  if (!existsSync(srcDir)) return [];
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

  return readdirSync(srcDir)
    .filter((f) => f.endsWith(ext))
    .map((file) => {
      const srcPath = join(srcDir, file);
      const destPath = join(destDir, file);
      const content = readFileSync(srcPath, "utf-8");

      if (existsSync(destPath)) {
        return { path: destPath, action: "skipped" as FileAction, content: readFileSync(destPath, "utf-8") };
      }

      writeFileSync(destPath, content, "utf-8");
      if (executable) chmodSync(destPath, 0o755);
      return { path: destPath, action: "created" as FileAction, content };
    });
};

const installAgents = (): InstallResult[] =>
  installFlatFiles(join(kitRoot, "agents"), join(claudeHome, "agents"), ".md");

const installHooks = (): InstallResult[] =>
  installFlatFiles(join(kitRoot, "hooks"), join(claudeHome, "hooks"), ".sh", true);

// ── Output ────────────────────────────────────────────────────────────────────

const printResults = (results: InstallResult[]): void => {
  const icon: Record<FileAction, string> = { created: "✓", skipped: "–" };

  console.log("\nInstalled:\n");
  for (const { path, action } of results) {
    console.log(`  ${icon[action]} ${path}  (${action})`);
  }

  console.log(`
Legend: ✓ created  – already present, skipped
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
    ...installSkills(),
    ...installAgents(),
    ...installHooks(),
  ];

  printResults(results);
  recordChecksums(results);
};

main();
