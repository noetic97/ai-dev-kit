/**
 * Minimal frontmatter reader for SKILL.md files.
 * Extracts scalar string values from YAML frontmatter blocks only.
 * Not a full YAML parser — handles `key: value` lines, nothing more.
 */

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;

const parseFrontmatter = (content: string): Readonly<Record<string, string>> => {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return {};

  return match[1].split("\n").reduce<Record<string, string>>((acc, line) => {
    const colon = line.indexOf(":");
    if (colon === -1) return acc;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (key && value) acc[key] = value;
    return acc;
  }, {});
};

export const readFrontmatterValue = (content: string, key: string): string | undefined =>
  parseFrontmatter(content)[key];
