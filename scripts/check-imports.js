/**
 * Resolve every relative import specifier in a repo against the filesystem.
 *
 * Catches the failure mode that `node --check` cannot: a file that parses
 * perfectly but imports a path that does not exist, which only blows up in the
 * browser at first click. Both static (`from "./x.js"`) and dynamic
 * (`import("./x.js")`) forms are checked, with query strings stripped.
 *
 *   node scripts/check-imports.js <repo-root> [--quiet]
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.argv[2];
if (!ROOT) { console.error("usage: node check-imports.js <repo-root> [--quiet]"); process.exit(1); }
const QUIET = process.argv.includes("--quiet");
const SKIP = new Set(["node_modules", ".git", "dist", "backup", "scripts", "build"]);

const PATTERNS = [
  /\bfrom\s*["'](\.\.?\/[^"']+)["']/g,   // static:  import x from './y.js'
  /\bimport\s*\(\s*["'](\.\.?\/[^"']+)["']\s*\)/g, // dynamic: import('./y.js')
  /\bimport\s*["'](\.\.?\/[^"']+)["']/g, // side-effect: import './y.js'
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|jsx|tsx|ts|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

let refs = 0;
const missing = [];
const seen = new Set();

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      const raw = m[1];
      const spec = raw.replace(/\?[^"']*$/, ""); // drop ?v=cache-buster
      if (!spec) continue;
      refs++;
      const line = src.slice(0, m.index).split("\n").length;

      // Resolve like a bundler: try the literal path, common extensions, and
      // directory index files — HTML pages sit at the site root, module files
      // sit beside their importer.
      const bases = [path.resolve(path.dirname(file), spec)];
      if (file.endsWith(".html")) bases.push(path.resolve(ROOT, spec.replace(/^\.\//, "")));
      const exts = ["", ".js", ".jsx", ".mjs", ".ts", ".tsx"];

      let exists = false;
      for (const base of bases) {
        for (const e of exts) {
          const c = base + e;
          if (fs.existsSync(c) && fs.statSync(c).isFile()) { exists = true; break; }
          const idx = path.join(base, "index" + (e || ".js"));
          if (fs.existsSync(idx) && fs.statSync(idx).isFile()) { exists = true; break; }
        }
        if (exists) break;
      }

      if (!exists) {
        const key = `${file}:${line}:${spec}`;
        if (seen.has(key)) continue;
        seen.add(key);
        missing.push({
          file: path.relative(ROOT, file),
          line,
          spec,
        });
      }
    }
  }
}

const name = path.basename(ROOT);
if (missing.length) {
  console.log(`${name}: ${refs} relative imports checked, ${missing.length} UNRESOLVED`);
  for (const x of missing) console.log(`  ${x.file}:${x.line}  ->  ${x.spec}`);
  process.exit(1);
}
console.log(`${name}: ${refs} relative imports, all resolve OK`);
if (!QUIET) { /* keep quiet by default in pipelines */ }
