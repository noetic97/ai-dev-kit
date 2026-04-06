import { copyFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const src = join(import.meta.dir, "..", "CLAUDE.md");
const dest = join(homedir(), ".claude", "CLAUDE.md");
copyFileSync(src, dest);
console.log(`✓ Installed global CLAUDE.md → ${dest}`);