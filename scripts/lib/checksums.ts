import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export const checksumsPath = join(homedir(), ".claude", ".kit-checksums");

// Maps absolute dest path → SHA256 of the content as originally installed by the kit.
// Used to distinguish "never touched" files (safe to auto-update) from locally modified ones.
export type Checksums = Readonly<Record<string, string>>;

export const computeHash = (content: string): string =>
  createHash("sha256").update(content, "utf-8").digest("hex");

const isChecksums = (value: unknown): value is Checksums =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value as Record<string, unknown>).every((v) => typeof v === "string");

export const readChecksums = (path: string): Checksums => {
  if (!existsSync(path)) return {};
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf-8"));
    return isChecksums(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const writeChecksums = (path: string, checksums: Checksums): void => {
  writeFileSync(path, JSON.stringify(checksums, null, 2) + "\n", "utf-8");
};

export const withHash = (
  checksums: Checksums,
  destPath: string,
  content: string,
): Checksums => ({ ...checksums, [destPath]: computeHash(content) });

export const withoutHash = (checksums: Checksums, destPath: string): Checksums =>
  Object.fromEntries(Object.entries(checksums).filter(([k]) => k !== destPath));
