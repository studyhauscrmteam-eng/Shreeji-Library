/**
 * Syntax-check every .js/.mjs in a repo.
 * ES modules need an .mjs extension for `node --check`; CommonJS needs .cjs,
 * so try both and only report a file as broken if neither parses.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const ROOT = process.argv[2];
const SKIP = new Set(["node_modules", ".git", "dist", "backup", "scripts"]);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.js$/.test(e.name)) out.push(p);
  }
  return out;
}

const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "synchk-"));
let ok = 0;
const bad = [];

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  let passed = false;
  let lastErr = "";
  for (const ext of [".mjs", ".cjs"]) {
    const tmp = path.join(tmpBase, "f" + ext);
    fs.writeFileSync(tmp, src, "utf8");
    try {
      execSync(`node --check "${tmp}"`, { stdio: "pipe" });
      passed = true;
      break;
    } catch (e) {
      lastErr = e.stderr ? e.stderr.toString() : String(e.message);
    }
  }
  if (passed) ok++;
  else bad.push({ file: path.relative(ROOT, file), lastErr });
}

fs.rmSync(tmpBase, { recursive: true, force: true });

console.log(`${path.basename(ROOT)}: ${ok} OK, ${bad.length} FAILED`);
for (const b of bad) {
  console.log(`\nFAIL ${b.file}\n${b.lastErr.trim()}`);
}
process.exit(bad.length ? 1 : 0);
