/**
 * Figure out the REAL Hosting upload contract by experiment.
 *
 * The discovery doc says: multipart POST of GZIP, hash = sha256(gzip).
 * Practice says "content hash doesn't match content". One of the two is wrong,
 * so try the four combinations against one small file and report which lands.
 *
 *   node scripts/upload-probe.js
 *
 * Read-only with respect to anything users can see: it creates throwaway
 * versions that are never released.
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const https = require("https");
const { GoogleAuth } = require("google-auth-library");

const PROJECT = "studyhaus-crm";
const SITE = "studyhaus-crm-student";
const BASE = `https://firebasehosting.googleapis.com/v1beta1`;
const KEY_FILE = path.resolve(__dirname, "..", "server", "serviceAccountKey.json");

const auth = new GoogleAuth({
  credentials: JSON.parse(fs.readFileSync(KEY_FILE, "utf8")),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");

function post(url, headers, body) {
  const u = new URL(url);
  const transport = u.protocol === "http:" ? require("http") : https;
  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        method: "POST",
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: { ...headers, "Content-Length": body.length },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            location: res.headers.location,
            body: Buffer.concat(chunks).toString("utf8"),
          })
        );
      }
    );
    req.on("error", reject);
    req.end(body);
  });
}

(async () => {
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;
  const api = (method, url, data) =>
    client.request({ url, method, data, validateStatus: () => true });

  const TARGET = path.resolve(__dirname, "..", "..", "..", "..",
    "BBAACCKKUUPP", "studyhaus-student", "login.html");
  const raw = fs.readFileSync(TARGET);
  const gz = zlib.gzipSync(raw, { level: 9 });
  console.log(`probe file login.html  raw=${raw.length}B gz=${gz.length}B`);

  const variants = [
    ["hash=sha256(gz)  body=gz   (doc)", sha(gz), gz, "multipart"],
    ["hash=sha256(raw) body=gz", sha(raw), gz, "multipart"],
    ["hash=sha256(gz)  body=raw", sha(gz), raw, "multipart"],
    ["hash=sha256(raw) body=raw", sha(raw), raw, "multipart"],
    ["hash=sha256(gz)  body=gz   RAW-POST (no multipart)", sha(gz), gz, "raw"],
  ];

  for (const [label, hash, content, style] of variants) {
    const v = await api("POST", `${BASE}/sites/${SITE}/versions`, {});
    if (v.status !== 200) { console.log(`  ${label}: version create ${v.status}`); continue; }
    const vid = v.data.name.split("/").pop();

    const p = await api(
      "POST",
      `${BASE}/sites/${SITE}/versions/${vid}:populateFiles`,
      { files: { "/login.html": hash } }
    );
    if (p.status !== 200) {
      console.log(`  ${label}: populateFiles ${p.status} ${JSON.stringify(p.data).slice(0, 200)}`);
      continue;
    }

    const url = `${p.data.uploadUrl}/${hash}`;
    let res;
    if (style === "raw") {
      res = await post(url, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      }, content);
    } else {
      const b = "----probe" + crypto.randomBytes(6).toString("hex");
      const body = Buffer.concat([
        Buffer.from(
          `--${b}\r\nContent-Disposition: form-data; name="file"; filename="login.html"\r\n` +
          `Content-Type: application/octet-stream\r\n\r\n`, "utf8"),
        content,
        Buffer.from(`\r\n--${b}--\r\n`, "utf8"),
      ]);
      res = await post(url, {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/form-data; boundary=${b}`,
      }, body);
    }

    // Follow one hop if it still redirects.
    if (res.location && res.status >= 300 && res.status < 400 && !/accounts\.google\.com/.test(res.location)) {
      const u2 = new URL(res.location);
      res = await new Promise((resolve, reject) => {
        const req = https.request(
          { method: "POST", hostname: u2.hostname, path: u2.pathname + u2.search,
            headers: { Authorization: `Bearer ${token}`, "Content-Length": content.length } },
          (r) => { const c = []; r.on("data", (x) => c.push(x)); r.on("end", () =>
            resolve({ status: r.statusCode, body: Buffer.concat(c).toString("utf8") })); }
        );
        req.on("error", reject); req.end(content);
      });
    }

    const short = res.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 160);
    const verdict = res.status === 200 ? "*** SUCCESS ***" : "fail";
    console.log(`  ${label}: ${res.status} ${verdict}`);
    console.log(`      ${short}`);
    if (res.status === 200) break;
  }
})().catch((e) => console.error("probe failed:", e.message || e));
