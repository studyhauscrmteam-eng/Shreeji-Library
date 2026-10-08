/**
 * Deploy a portal to Firebase Hosting over the REST API.
 *
 *   node scripts/deploy-hosting.js <siteId> <sourceDir> [--dry-run]
 *   node scripts/deploy-hosting.js --create-site <siteId>
 *   node scripts/deploy-hosting.js --add-domain <siteId> <hostname>
 *   node scripts/deploy-hosting.js --status
 *
 * Why REST instead of `firebase deploy`: the logged-in CLI account has no
 * `serviceusage.services.use` on `studyhaus-crm`, so the CLI dies in its
 * "ensure required API is enabled" step before it ever reads a file. The
 * project's own service-account key (server/serviceAccountKey.json) mints a
 * working token — same trick deploy-rules.js uses for firestore.rules.
 *
 * API shape taken from the live discovery document
 * (https://firebasehosting.googleapis.com/$discovery/rest?version=v1beta1),
 * not guessed:
 *
 *   1. POST  v1beta1/sites/{site}/versions                       -> Version
 *   2. POST  v1beta1/sites/{site}/versions/{v}:populateFiles
 *          body  { files: { "<path>": "<sha256 of GZIP>" } }
 *          ->   { uploadUrl, uploadRequiredHashes }
 *   3. POST  {uploadUrl}/{hash}  body = the GZIPPED bytes, octet-stream.
 *          NOTE the discovery doc claims this is a multipart POST; it is not.
 *          scripts/upload-probe.js proved multipart always 400s with
 *          "content hash doesn't match content" while the raw body returns 200.
 *   4. PATCH v1beta1/sites/{site}/versions/{v}?updateMask=status
 *          body { status: "FINALIZED" }      (CREATED -> FINALIZED only)
 *   5. POST  v1beta1/sites/{site}/channels/live/releases
 *          ?versionName=sites/{site}/versions/{v}
 *
 * The hash is over the GZIPPED bytes (discovery doc, PopulateVersionFilesRequest):
 * "Calculate a hash by Gzipping the file then taking the SHA256 hash of the
 * newly compressed file."
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const https = require("https");
const { GoogleAuth } = require("google-auth-library");

const PROJECT = "studyhaus-crm";
const BASE = "https://firebasehosting.googleapis.com/v1beta1";
const KEY_FILE = path.resolve(__dirname, "..", "server", "serviceAccountKey.json");
const UPLOAD_HOST = "upload-firebasehosting.googleapis.com";

const auth = new GoogleAuth({
  credentials: JSON.parse(fs.readFileSync(KEY_FILE, "utf8")),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
let clientPromise = null;
const getClient = () => (clientPromise ||= auth.getClient());

async function api(method, url, body) {
  const client = await getClient();
  const res = await client.request({
    url,
    method,
    headers: { "Content-Type": "application/json" },
    data: body,
    validateStatus: () => true,
  });
  return { status: res.status, data: res.data };
}

const die = (msg, data) => {
  console.error(`\nERROR: ${msg}`);
  if (data !== undefined) console.error(JSON.stringify(data, null, 2).slice(0, 2000));
  process.exit(1);
};

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------

/** Globs the CLI always honours, plus the repo-specific noise we never ship. */
const ALWAYS_IGNORE = [
  /^\.git(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.[^\/]+$/, // dotfiles / dot-dirs (.firebaserc, .gitignore …)
  /^firebase\.json$/,
  /^firestore\.rules$/,
  /^firestore\.indexes\.json$/,
  /^package(-lock)?\.json$/,
  /(^|\/)backup(\/|$)/,
  /(^|\/)scripts(\/|$)/, // dev tooling: tests, harnesses, migrators
  /\.(md|log)$/,
  /(^|\/)dist(\/|$)/,
];

function shouldIgnore(rel) {
  const norm = rel.replace(/\\/g, "/");
  return ALWAYS_IGNORE.some((re) => re.test(norm));
}

function collectFiles(root) {
  const out = [];
  (function walk(dir, prefix) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (shouldIgnore(rel)) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs, rel);
      else if (entry.isFile()) out.push({ rel, abs });
    }
  })(root, "");
  return out;
}

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

// ---------------------------------------------------------------------------
// Multipart upload of gzipped file bytes
// ---------------------------------------------------------------------------

async function getToken() {
  const client = await getClient();
  const t = await client.getAccessToken();
  if (!t || !t.token) die("could not mint an access token from the service account");
  return t.token;
}

/**
 * POST the gzipped bytes straight through — NOT multipart.
 *
 * The discovery doc says "Perform a multipart POST of the Gzipped file
 * contents", and every multipart shape we tried (gzip/raw content x) came back
 * 400 "content hash doesn't match content". scripts/upload-probe.js settled it:
 * sha256(gzip) + raw gzipped body + `application/octet-stream` -> 200.
 * Trust the experiment, not the comment.
 */
function uploadFile(uploadUrl, hash, gzipBuf, token, redirectHops = 0) {
  const u = new URL(`${uploadUrl}/${hash}`);
  const transport = u.protocol === "http:" ? require("http") : https;

  const payload = {
    method: "POST",
    hostname: u.hostname,
    port: u.port || undefined,
    path: u.pathname + u.search,
    headers: {
      // WITHOUT this, upload-firebasehosting 302s to accounts.google.com and
      // the follow-up POST lands on a 400.
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Content-Length": gzipBuf.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = transport.request(payload, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const out = {
          status: res.statusCode,
          body: Buffer.concat(chunks).toString("utf8"),
          location: res.headers.location,
        };
        if (res.statusCode >= 300 && res.statusCode < 400 && out.location) {
          if (process.env.HOSTING_DEBUG && redirectHops < 2) {
            console.error(`\n[debug] ${res.statusCode} -> ${out.location.slice(0, 400)}`);
          }
          if (redirectHops >= 5) return resolve(out);
          return resolve(uploadFile(out.location, hash, gzipBuf, token, redirectHops + 1));
        }
        resolve(out);
      });
    });
    req.on("error", reject);
    req.end(gzipBuf);
  });
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function status() {
  const sites = await api("GET", `${BASE}/projects/${PROJECT}/sites?pageSize=50`);
  if (sites.status !== 200) die("sites.list failed", sites.data);
  const list = sites.data.sites || [];
  if (!list.length) console.log("No hosting sites.");
  for (const s of list) {
    console.log(`\n${s.siteId || s.name}`);
    console.log(`  url      ${s.defaultUrl}`);
    const rel = await api("GET", `${BASE}/${s.name}/releases?pageSize=3`);
    const versions = await api("GET", `${BASE}/${s.name}/versions?pageSize=3`);
    const nRel = (rel.data && rel.data.releases) || [];
    const nVer = (versions.data && versions.data.versions) || [];
    console.log(`  versions ${nVer.length}${nVer[0] ? " (latest: " + nVer[0].status + ")" : " — NOTHING DEPLOYED"}`);
    console.log(`  releases ${nRel.length}`);
    if (nRel[0]) console.log(`  live     ${nRel[0].versionName}`);
    const dom = await api("GET", `${BASE}/${s.name}/domains`);
    const d = (dom.data && dom.data.domains) || [];
    console.log(`  domains  ${d.length ? d.map((x) => x.domainName).join(", ") : "(none)"}`);
  }
}

async function createSite(siteId) {
  const r = await api("POST", `${BASE}/projects/${PROJECT}/sites?siteId=${siteId}`, {});
  if (r.status !== 200 && r.status !== 201) die(`create site ${siteId} failed`, r.data);
  console.log(`created  ${r.data.defaultUrl}`);
  console.log(`         ${r.data.name}`);
}

async function addDomain(siteId, hostname) {
  // Domain requires BOTH `site` and `domainName`; omitting `site` is what made
  // the API say "Mismatched sites … domain has ``".
  const body = {
    site: siteId,
    domainName: hostname,
  };
  const r = await api("POST", `${BASE}/sites/${siteId}/domains`, body);
  if (r.status !== 200 && r.status !== 201) die(`add domain ${hostname} failed`, r.data);
  const d = r.data;
  console.log(`status      ${d.status}`);
  const p = d.provisioning || {};
  console.log(`cert state  ${p.certState || "(none)"}`);
  console.log(`dns state   ${p.dnsStatus || "(none)"}`);
  console.log(`host state  ${p.hostState || "(none)"}`);
  if (p.certChallengeDns) console.log(`dns challenge TXT:\n  ${JSON.stringify(p.certChallengeDns)}`);
  if (p.dnsFetchTime) console.log(`last DNS check ${p.dnsFetchTime}`);
  console.log("\nfull:\n" + JSON.stringify(d, null, 2).slice(0, 2500));
}

/**
 * Convert firebase.json `hosting.headers` / `hosting.rewrites` into the API's
 * ServingConfig shape.
 *
 * Two schema differences from firebase.json:
 *   source    -> glob
 *   headers:[{key,value}] -> headers:{ key: value }   (array of pairs -> map)
 *   destination -> path
 *
 * ServingConfig hangs off the VERSION (`Version.config`), NOT the site —
 * sites.updateConfig only accepts maxVersions/cloudLoggingEnabled, which is
 * why PATCH .../config rejected headers/rewrites with "Cannot find field".
 */
function buildServingConfig(root) {
  const p = path.join(root, "firebase.json");
  if (!fs.existsSync(p)) return undefined;
  const hosting = JSON.parse(fs.readFileSync(p, "utf8")).hosting || {};
  const cfg = {};

  if (Array.isArray(hosting.headers) && hosting.headers.length) {
    cfg.headers = hosting.headers
      .filter((h) => h && h.source)
      .map((h) => {
        const map = {};
        for (const kv of h.headers || []) if (kv && kv.key) map[kv.key] = String(kv.value ?? "");
        return { glob: h.source, headers: map };
      });
  }

  if (Array.isArray(hosting.rewrites) && hosting.rewrites.length) {
    cfg.rewrites = hosting.rewrites
      .filter((r) => r && r.source)
      .map((r) => ({ glob: r.source, path: r.destination }));
  }

  if (hosting.cleanUrls) cfg.cleanUrls = !!hosting.cleanUrls;
  return Object.keys(cfg).length ? cfg : undefined;
}

async function deploy(siteId, sourceDir, dryRun) {
  const root = path.resolve(sourceDir);
  if (!fs.existsSync(root)) die(`source dir not found: ${root}`);

  const files = collectFiles(root);
  if (!files.length) die("nothing to upload — everything was ignored?");

  let totalRaw = 0;
  const manifest = files.map((f) => {
    const raw = fs.readFileSync(f.abs);
    const gz = zlib.gzipSync(raw, { level: 9 });
    totalRaw += raw.length;
    return { ...f, raw, gz, hash: sha256(gz) };
  });

  console.log(`\nsite    ${siteId}`);
  console.log(`source  ${root}`);
  console.log(`files   ${manifest.length}`);
  console.log(`size    ${(totalRaw / 1024 / 1024).toFixed(2)} MB`);

  if (dryRun) {
    console.log("\n--dry-run, first 40 entries:");
    manifest.slice(0, 40).forEach((f) => console.log(`  ${f.rel}`));
    if (manifest.length > 40) console.log(`  … +${manifest.length - 40} more`);
    return;
  }

  // 1. create version (carries headers/rewrites)
  const servingConfig = buildServingConfig(root);
  const v = await api("POST", `${BASE}/sites/${siteId}/versions`, servingConfig ? { config: servingConfig } : {});
  if (v.status !== 200 && v.status !== 201) die("create version failed", v.data);
  const versionName = v.data.name; // sites/{site}/versions/{id}
  const versionId = versionName.split("/").pop();
  console.log(`version ${versionId} (${v.data.status})`);
  console.log(`config  ${servingConfig ? Object.keys(servingConfig).join(", ") + " from firebase.json" : "(none)"}`);

  // 2. populate files (keys are site-relative and MUST start with a slash —
  //    the API rejects "foo/bar.js" with "must start with a slash")
  const filesMap = {};
  for (const f of manifest) filesMap[`/${f.rel}`] = f.hash;
  const p = await api(
    "POST",
    `${BASE}/sites/${siteId}/versions/${versionId}:populateFiles`,
    { files: filesMap }
  );
  if (p.status !== 200) die("populateFiles failed", p.data);
  const { uploadUrl, uploadRequiredHashes = [] } = p.data;
  console.log(`upload  ${uploadRequiredHashes.length} new / ${manifest.length} total`);
  if (process.env.HOSTING_DEBUG) console.error(`[debug] uploadUrl = ${uploadUrl}`);

  // 3. upload only what the server says it still needs
  const token = await getToken();
  const byHash = new Map(manifest.map((f) => [f.hash, f]));
  let done = 0;
  for (const hash of uploadRequiredHashes) {
    const f = byHash.get(hash);
    if (!f) die(`server asked for unknown hash ${hash}`);
    const up = await uploadFile(uploadUrl, hash, f.gz, token);
    if (up.status !== 200 && up.status !== 201) {
      die(`upload failed (${up.status}) for ${f.rel}${up.location ? ` -> ${up.location.slice(0, 300)}` : ""}`, up.body);
    }
    done++;
    if (done % 25 === 0 || done === uploadRequiredHashes.length) {
      process.stdout.write(`\r  uploaded ${done}/${uploadRequiredHashes.length}`);
    }
  }
  console.log("");

  // 4. finalize
  const fin = await api(
    "PATCH",
    `${BASE}/sites/${siteId}/versions/${versionId}?updateMask=status`,
    { status: "FINALIZED" }
  );
  if (fin.status !== 200) die("finalize version failed", fin.data);
  console.log(`version ${versionId} -> ${fin.data.status}`);

  // 5. release to live
  const rel = await api(
    "POST",
    `${BASE}/sites/${siteId}/channels/live/releases?versionName=${encodeURIComponent(versionName)}`,
    {}
  );
  if (rel.status !== 200 && rel.status !== 201) die("release failed", rel.data);
  console.log(`release ${rel.data.name}`);

  console.log(`\nLIVE  https://${siteId}.web.app`);
}

// ---------------------------------------------------------------------------

(async () => {
  const argv = process.argv.slice(2);
  const dry = argv.includes("--dry-run");

  if (argv[0] === "--status") return await status();
  if (argv[0] === "--create-site") return await createSite(argv[1]);
  if (argv[0] === "--add-domain") return await addDomain(argv[1], argv[2]);

  const [siteId, sourceDir] = argv.filter((a) => !a.startsWith("--"));
  if (!siteId || !sourceDir) {
    console.error("usage: node scripts/deploy-hosting.js <siteId> <sourceDir> [--dry-run]");
    console.error("       --status | --create-site <id> | --add-domain <id> <host>");
    process.exit(2);
  }
  await deploy(siteId, sourceDir, dry);
})().catch((e) => {
  console.error("deploy failed:", (e && e.message) || e);
  if (e && e.response && e.response.data) console.error(JSON.stringify(e.response.data));
  process.exit(1);
});
