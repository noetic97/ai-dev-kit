import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";

// Maps absolute dest path → SHA256 of the content as originally installed by the kit.
// Used to distinguish "never touched" files (safe to auto-update) from locally modified ones.
export type Checksums = Readonly<Record<string, string>>;

export const computeHash = (content: string): string =>
  createHash("sha256").update(content, "utf-8").digest("hex");

export const readChecksums = (path: string): Checksums => {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as Checksums;
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
