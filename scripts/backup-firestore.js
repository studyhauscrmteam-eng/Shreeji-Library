/**
 * Full Firestore export to a local JSON file.
 *
 * This is the SAFETY NET that must be run before any migration.
 *
 * Usage:
 *   node scripts/backup-firestore.js               # writes backup/firestore-<ts>.json
 *   node scripts/backup-firestore.js --out my.json  # explicit output path
 *
 * Nothing in this script writes to Firestore. It is read-only.
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const KEY_PATH = path.join(__dirname, '..', 'server', 'serviceAccountKey.json');

function loadCredentials() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Service account key not found at ${KEY_PATH}`);
  }
  return require(KEY_PATH);
}

function getOutPath() {
  const outIdx = process.argv.indexOf('--out');
  if (outIdx !== -1 && process.argv[outIdx + 1]) {
    return path.resolve(process.argv[outIdx + 1]);
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(__dirname, '..', 'backup', `firestore-${ts}.json`);
}

async function main() {
  const creds = loadCredentials();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(creds),
      projectId: creds.project_id,
    });
  }

  const db = admin.firestore();
  const outPath = getOutPath();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  console.log(`Project : ${creds.project_id}`);
  console.log(`Mode    : READ-ONLY export`);
  console.log(`Output  : ${outPath}`);
  console.log('');

  const docs = await collectAllDocuments(db);

  const payload = {
    meta: {
      projectId: creds.project_id,
      exportedAt: new Date().toISOString(),
      documentCount: docs.length,
      formatVersion: 1,
    },
    documents: docs.map((d) => ({
      // Firestore doc path, e.g. "students/abc123"
      path: d.ref.path,
      id: d.id,
      parent: d.ref.parent ? d.ref.parent.path : null,
      // Convert Firestore Timestamps to a portable {__type, value} form
      data: encodeValues(d.data()),
    })),
  };

  // Group by top-level collection for a quick human-readable summary
  const byCollection = {};
  for (const doc of payload.documents) {
    const top = doc.path.split('/')[0];
    byCollection[top] = (byCollection[top] || 0) + 1;
  }

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');

  const size = fs.statSync(outPath).size;
  console.log(`Exported ${docs.length} documents (${(size / 1024 / 1024).toFixed(2)} MB)`);
  console.log('');
  console.log('Per-collection counts:');
  Object.keys(byCollection)
    .sort((a, b) => byCollection[b] - byCollection[a])
    .forEach((c) => console.log(`  ${String(byCollection[c]).padStart(5)}  ${c}`));

  console.log('');
  console.log(`BACKUP OK -> ${outPath}`);
}

/**
 * Recursively walk every collection and subcollection.
 * Uses id-ordered cursor pagination so it works on any firebase-admin version
 * and does not blow up on large collections.
 */
async function collectAllDocuments(db) {
  const out = [];

  async function walkCollection(ref) {
    let last = null;
    for (;;) {
      let q = ref.orderBy('__name__').limit(400);
      if (last) q = q.startAfter(last);
      const snap = await q.get();
      if (snap.empty) break;

      for (const doc of snap.docs) {
        out.push(doc);
        // Recurse into any subcollections this document owns
        const subs = await doc.ref.listCollections();
        for (const sub of subs) await walkCollection(sub);
      }

      last = snap.docs[snap.docs.length - 1];
      if (snap.docs.length < 400) break;
    }
  }

  const roots = await db.listCollections();
  for (const root of roots) await walkCollection(root);
  return out;
}

/** Recursively convert Firestore special values into a JSON-safe representation. */
function encodeValues(value) {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return { __type: 'timestamp', value: value.toISOString() };
  }

  // Firestore Timestamp (has both toMillis and toISOString-like shape)
  if (typeof value === 'object' && typeof value.toMillis === 'function') {
    return { __type: 'timestamp', value: new Date(value.toMillis()).toISOString() };
  }

  // GeoPoint
  if (typeof value === 'object' && typeof value.latitude === 'number' && typeof value.longitude === 'number') {
    return { __type: 'geopoint', latitude: value.latitude, longitude: value.longitude };
  }

  // DocumentReference
  if (typeof value === 'object' && typeof value.path === 'string' && typeof value.firestore === 'object') {
    return { __type: 'ref', value: value.path };
  }

  if (Array.isArray(value)) return value.map(encodeValues);

  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = encodeValues(v);
    return out;
  }

  if (typeof value === 'object' && typeof value.toBase64 === 'function') {
    return { __type: 'bytes', value: value.toBase64() };
  }

  return value;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('');
    console.error('BACKUP FAILED');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  });
