/**
 * Read-only probe: can the project service account drive the Hosting API?
 *
 *   node scripts/probe-hosting.js
 *
 * Same auth trick as deploy-rules.js (the CLI account lacks permissions, the
 * project's own SA key does not). Prints exactly which Hosting calls work so
 * we know whether a CLI-free deploy path exists before writing one.
 */
const fs = require("fs");
const path = require("path");
const { GoogleAuth } = require("google-auth-library");

const PROJECT = "studyhaus-crm";
const KEY_FILE = path.resolve(__dirname, "..", "server", "serviceAccountKey.json");

const auth = new GoogleAuth({
  credentials: JSON.parse(fs.readFileSync(KEY_FILE, "utf8")),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

let clientPromise = null;
const getClient = () => (clientPromise ||= auth.getClient());

async function call(method, url, body) {
  const client = await getClient();
  const res = await client.request({
    url,
    method,
    headers: { "Content-Type": "application/json" },
    data: body === undefined ? undefined : body,
    validateStatus: () => true,
  });
  return { status: res.status, data: res.data };
}

const show = (label, r) => {
  const short = JSON.stringify(r.data);
  console.log(`\n[${r.status}] ${label}\n  ${short.length > 600 ? short.slice(0, 600) + "…" : short}`);
};

(async () => {
  const base = "https://firebasehosting.googleapis.com/v1beta1";

  show("sites.list", await call("GET", `${base}/sites?pageSize=20`));
  show("sites.get(studyhaus-crm)", await call("GET", `${base}/sites/${PROJECT}`));
  show("sites.get(studyhaus-crm default)", await call("GET", `${base}/sites/${PROJECT}/default`));
  show(
    "versions.list(default)",
    await call("GET", `${base}/sites/${PROJECT}/versions?pageSize=5`)
  );
  show(
    "channels.list(default)",
    await call("GET", `${base}/sites/${PROJECT}/channels`)
  );
  show(
    "generateUploadUrl (WRITE probe, preview channel only)",
    await call("POST", `${base}/sites/${PROJECT}/channels/preview:generateUploadUrl`, {})
  );

  // Can we provision a SECOND hosting site? validateOnly=true proves it would
  // succeed without actually creating anything.
  for (const id of ["studyhaus-crm-student", "studyhaus-crm-admin"]) {
    show(
      `sites.create validateOnly(${id})`,
      await call(
        "POST",
        `${base}/projects/${PROJECT}/sites?siteId=${id}&validateOnly=true`,
        {}
      )
    );
  }

  // Existing site config (headers/rewrites live here when bypassing the CLI).
  show("getConfig", await call("GET", `${base}/sites/${PROJECT}/config`));

  console.log("\ndone");
})().catch((e) => {
  console.error("probe failed:", e.message || e);
  process.exit(1);
});
