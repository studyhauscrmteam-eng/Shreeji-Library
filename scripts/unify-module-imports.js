/**
 * Strip `?v=...` cache-busting query strings from INTERNAL relative module
 * specifiers across a repo.
 *
 * Why: "./a.js?v=1" and "./a.js?v=2" are two different URLs, so the browser
 * loads two live copies of the same module — double listeners, duplicate
 * module-level state, and split-brain between an entry page and a shared
 * helper. Each module must resolve to exactly ONE URL per page load.
 *
 * Cache correctness still holds without the query: the deploy target serves
 * `Cache-Control: public, max-age=0, must-revalidate`, so an unchanged URL
 * revalidates against the file's ETag and picks up the new bytes.
 *
 * Only specifiers of the form  ./path/x.js?v=...  are touched — external URLs,
 * non-JS assets and query-less imports are left alone. Run with --dry to list.
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.argv[2];
if (!ROOT) {
  console.error("usage: node unify-module-imports.js <repo-root> [--dry]");
  process.exit(1);
}
const DRY = process.argv.includes("--dry");
const SKIP = new Set(["node_modules", ".git", "dist", "backup", "scripts"]);

// "./x.js?v=1" or "../a/b.js?v=ui2" -> "./x.js"  (internal, relative, JS only)
const Q = /(["'])(\.{1,2}\/[^"'\s]+?\.js)(\?v=[^"'\s]+)\1/g;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

let files = 0,
  hits = 0;
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  let n = 0;
  const out = src.replace(Q, (m, q, spec) => {
    n++;
    return q + spec + q;
  });
  if (n) {
    hits += n;
    files++;
    const rel = path.relative(ROOT, file);
    console.log(`${rel}  (${n} import${n > 1 ? "s" : ""})`);
    if (!DRY) fs.writeFileSync(file, out, "utf8");
  }
}

console.log(
  DRY
    ? `\nDRY RUN: ${hits} versioned import(s) in ${files} file(s) would be normalised.`
    : `\nNormalised ${hits} versioned import(s) across ${files} file(s).`
);
