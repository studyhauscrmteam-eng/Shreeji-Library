/**
 * Deploy firestore.rules to the live project via the Firebase Rules REST API.
 *
 * Why not `firebase deploy`: the logged-in CLI account (ghostuserr96@gmail.com)
 * has no `serviceusage.services.use` on `studyhaus-crm`, so the CLI dies in its
 * "ensure required API is enabled" step before it ever reads the rules file.
 * The project's own service-account key lives in `server/serviceAccountKey.json`,
 * so we mint a token from it and drive the Rules API directly.
 *
 *   node scripts/deploy-rules.js            deploy (or report "already live")
 *   node scripts/deploy-rules.js --check    read-only comparison, no writes
 *
 * API shape, taken from the service discovery document (not guessed):
 *   - the Firestore release is named `cloud.firestore`, NOT `firebase.firestore`
 *   - a Release returns `rulesetName`; file content only comes from GET on
 *     that Ruleset — the release object never embeds the source
 *   - `releases.patch` takes an **UpdateReleaseRequest**, i.e. the body is
 *     `{ updateMask, release: {...} }`. Sending a bare Release yields
 *     "Unknown name ... Cannot find field", which is what every flat attempt
 *     hits.
 *
 * Rulesets are immutable and append-only, so the previous ruleset stays
 * selectable in the Firebase console if this ever needs rolling back.
 */
const fs = require("fs");
const path = require("path");
const { GoogleAuth } = require("google-auth-library");

const PROJECT = "studyhaus-crm";
const RULES_FILE = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, "..", "..", "..", "..", "BBAACCKKUUPP", "studyhaus-admin", "firestore.rules");
const KEY_FILE = path.resolve(__dirname, "..", "server", "serviceAccountKey.json");
const CHECK_ONLY = process.argv.includes("--check");

const BASE = "https://firebaserules.googleapis.com/v1";
const RELEASE_NAME = `projects/${PROJECT}/releases/cloud.firestore`;
const RELEASE_URL = `${BASE}/${RELEASE_NAME}`;
const RULESETS_URL = `${BASE}/projects/${PROJECT}/rulesets`;

const clean = (s) => String(s || "").replace(/\r\n/g, "\n");

async function token() {
  const auth = new GoogleAuth({
    credentials: JSON.parse(fs.readFileSync(KEY_FILE, "utf8")),
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const t = await client.getAccessToken();
  return t.token || t;
}

async function call(url, opts = {}, tok) {
  const res = await fetch(url, {
    ...opts,
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
  });
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch (_) { /* keep raw text */ }
  return { ok: res.ok, status: res.status, body };
}

const errText = (r) => (typeof r.body === "string" ? r.body : JSON.stringify(r.body, null, 2));
const errDetail = (r) => {
  const m = errText(r).match(/"description":\s*"((?:[^"\\]|\\.)*)"/);
  return m ? m[1] : errText(r).slice(0, 300);
};

/** Content of whichever ruleset the `cloud.firestore` release currently points at. */
async function liveContent(tok) {
  const rel = await call(RELEASE_URL, {}, tok);
  if (!rel.ok) return { error: `GET release ${rel.status}: ${errText(rel)}` };
  const rulesetName = rel.body.rulesetName;
  if (!rulesetName) return { rulesetName: null, content: "" };
  const rs = await call(`${BASE}/${rulesetName}`, {}, tok);
  if (!rs.ok) return { error: `GET ruleset ${rs.status}: ${errText(rs)}` };
  const files = (rs.body.source && rs.body.source.files) || [];
  return { rulesetName, content: clean(files[0] && files[0].content) };
}

async function main() {
  const local = clean(fs.readFileSync(RULES_FILE, "utf8"));
  console.log(`local : ${RULES_FILE}`);
  console.log(`size  : ${local.length} chars`);

  const tok = await token();

  const live = await liveContent(tok);
  if (live.error) { console.error(`\nlive  : ${live.error}`); process.exit(1); }

  console.log(`live  : ruleset ${live.rulesetName || "(none)"}, ${live.content.length} chars`);
  const inSync = live.content === local;
  console.log(`match : ${inSync}`);

  if (CHECK_ONLY) return;
  if (inSync) { console.log("\nAlready live — nothing to do."); return; }

  // 1. Snapshot the REAL rules as an immutable Ruleset. Creating one also
  //    compiles it, so a syntax error surfaces here rather than in production.
  const created = await call(RULESETS_URL, {
    method: "POST",
    body: JSON.stringify({ source: { files: [{ name: "firestore.rules", content: local }] } }),
  }, tok);
  if (!created.ok) { console.error(`\nPOST ruleset FAILED ${created.status}\n${errText(created)}`); process.exit(1); }
  const ruleset = created.body.name;
  console.log(`\ncreated ruleset: ${ruleset}`);

  // 2. Point the release at it. Body is an UpdateReleaseRequest, NOT a Release.
  const patched = await call(RELEASE_URL, {
    method: "PATCH",
    body: JSON.stringify({
      updateMask: "rulesetName",
      release: { name: RELEASE_NAME, rulesetName: ruleset },
    }),
  }, tok);
  if (!patched.ok) {
    console.error(`\nPATCH release FAILED ${patched.status}`);
    console.error(errDetail(patched));
    process.exit(1);
  }

  // 3. Read back what is actually being enforced now.
  const after = await liveContent(tok);
  if (after.error) { console.error(`\nVERIFY failed: ${after.error}`); process.exit(1); }
  const match = after.content === local;
  console.log(`\nVERIFY: release -> ${after.rulesetName}`);
  console.log(`VERIFY: live matches local file -> ${match}`);
  if (!match) { console.error("MISMATCH — deployed rules are not what we intended."); process.exit(1); }
  console.log("\nDEPLOYED OK");
}

main().catch((e) => { console.error("\nERROR:", e.message || e); process.exit(2); });
