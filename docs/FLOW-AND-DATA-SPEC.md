# Shreeji Library — Flow & Data Contract (v1)

**This file is the single source of truth for all three repos.**

| Repo | Path | Serves |
|---|---|---|
| A | `D:\code\LIB\New folder\Shreeji-Library` | Public marketing website |
| C-adm | `D:\code\BBAACCKKUUPP\studyhaus-admin` | Staff/admin portal |
| C-stu | `D:\code\BBAACCKKUUPP\studyhaus-student` | Student portal |

All three point at **one Firebase project: `studyhaus-crm`**.
`D:\code\SHREEJICRM\studyhaus-crm` is a **stale pre-split monolith — do not touch it.**

---

## 1. Constraints (non-negotiable)

1. **No data is deleted.** Merges mark `mergedInto`; never `deleteDoc` on student records.
2. **No plan/infra change.** No Blaze-only features, no Firebase Storage, no Cloud Functions.
3. **Images stay base64 in Firestore.** Firestore caps a document at ~1 MB. With 4 image
   fields (`aadhaarFront`, `aadhaarBack`, `photo`, `paymentScreenshot`) **each must be
   capped at 220 000 base64 chars (~165 KB)**. Never write an unbounded image into a doc.
4. **Website keeps working at every commit.** Each phase must be independently deployable.
5. **`firestore.rules` must be byte-identical in C-adm and C-stu** (same project).
6. **Phone is NOT a unique key.** Real families share one phone number in this dataset
   (`સોલા અજય` / `સોલા દિગવીજય` both on 8160699800). Never hard-block on phone.

---

## 2. Canonical schema

### `students/{docId}` — one document per person
`docId` = **Firebase Auth uid** when the student has a portal login.
Legacy students with no login keep their existing auto-ID; when admin later creates a
login, the doc is migrated to `students/{uid}` (existing `createPortalLoginForStudent`).

```
IDENTITY
  studentId        "SH-0042"        sequential, counters/students
  admissionNo      "SH-0042"        legacy alias, same value
  uid              auth uid or ""
  authEmail        alias actually used by Firebase Auth
  loginId          display only (Owner sees)
  loginPassword    display only (Owner sees)
  loginCredentials "loginId / password"  legacy display
  role             always "Student"
  name phone email dob gender parentPhone college course address remarks
  photo | profilePhotoUrl

MEMBERSHIP
  planId planName
  seatNumber       "" | "A01"   (canonical padded form)
  seatId           == seatNumber after re-key
  paymentMethod    "Pay Later" | "Paid"
  transactionId paymentDueDate paymentScreenshotUrl

LIFECYCLE
  status           Pending | Active | Inactive | Old | Rejected
  approvalStatus   Pending | Approved | Rejected | Changes Requested
  source           Website | Portal | Admin
  isStudentSubmission  bool
  needsReview      bool    migration flagged a possible duplicate
  mergedInto       ""      path of surviving doc if merged
  rejectReason adminNotes termsAccepted
  createdAt updatedAt (serverTimestamp)
```

### `users/{uid}` — role-resolution source, written at signup
```
uid email name role:"Student" status loginId profilePhotoUrl createdAt
```
Both `students/{uid}` **and** `users/{uid)` are written in the **same transaction** at
signup. Role resolution can therefore never fail with "profile not found".

### `admissions` — RETIRED as a data store
No new writes ever. The 11 legacy docs stay untouched as history.
The admin approval queue reads **`students` where `approvalStatus == "Pending"`**.

### `seats/{seatNumber}` — deterministic, e.g. `seats/A17`
```
seatNumber floor col row status assignedStudentId assignedStudentName planType lastUpdated
status: Available | Reserved | Occupied | Maintenance | Inactive
```

### `studentDocuments/{studentId}` — `studentId` == the student's doc id
```
aadhaarFront aadhaarBack photo paymentScreenshot   (base64, each <= 220000 chars)
studentId updatedAt
```

### `visitors/{autoId}` — walk-in visitors **and** website leads
```
visitorName phone email message purpose
employeeName employeeId visitDate visitTime
source      "Website" | "Walk-in"
leadStatus  "New" | "Converted" | "Closed"      (website leads)
status      "Active" | "Completed"              (existing walk-in lifecycle)
linkedStudentId ""
remarks createdAt updatedAt
```

### `payments/{autoId}`
```
studentId studentName planName amount renewalPeriod monthLabel
transactionId paymentScreenshotUrl paymentMethod
status  "pending" | "approved" | "rejected"      (NEVER "Completed")
dueDateStr date approvedBy approvalDate remark createdAt
```

### `uniqueness/{key}` — NEW, always written inside a transaction
```
sub_<submissionKey>  { kind:"submission", docPath, createdAt }
email_<email>        { kind:"email", uid, createdAt }
txn_<txnId>          { kind:"transactionId", paymentId, createdAt }
```
There is deliberately **no `phone_*` key** (see constraint 6).

---

## 3. Portal state machine (C-stu)

```js
resolvePortalState(studentDoc, plan):
  if (!studentDoc)                       -> SIGNUP      // no doc yet
  if (approvalStatus === 'Rejected')     -> REJECTED
  if (approvalStatus === 'Approved' &&
      status === 'Active')               -> DASHBOARD   // main content
  if (!detailsComplete(studentDoc))      -> DETAILS
  if (!docsComplete(studentDocuments))   -> DOCUMENTS
  if (!studentDoc.planId)                -> PLAN
  if (plan.seatPreference && !studentDoc.seatNumber) -> SEAT
  if (!paymentComplete(studentDoc))      -> PAYMENT
  return PENDING                          // submitted, awaiting admin
```
```js
detailsComplete = name && phone && dob && gender && college && course && address
docsComplete    = aadhaarFront && aadhaarBack && photo
paymentComplete = paymentMethod && (
                    paymentMethod === 'Pay Later' ? paymentDueDate
                                                  : transactionId && paymentScreenshotUrl)
```

* First visit runs the wizard step by step.
* A student who abandons **resumes at the matching step** — never restarts, never duplicates.
* After approval every later login resolves to `DASHBOARD` immediately.
* The sidebar / main nav stays **hidden** until state === `DASHBOARD`.

---

## 4. Seat-map gating

`membershipPlans.seatPreference === true` ⇒ the plan is a **fixed-seat / seat-preferred**
plan and the seat map is shown (and required). Any other value ⇒ no seat map; admin
assigns later. Existing data has 4 legacy plans with `seatPreference` undefined — the
migration sets an explicit `false` on those so the gate is never `undefined`.

Only `status === "Available"` seats are pickable. Reserving a seat is a **Firestore
transaction on `seats/{seatNumber}`** that fails cleanly if the seat is no longer free.

---

## 5. Cross-repo shared files

These exist in **both** C-adm and C-stu and must stay behaviourally aligned where noted:

| File | Alignment rule |
|---|---|
| `firestore.rules` | **byte-identical** (managed centrally, see §6) |
| `config/firebaseConfig.js` | identical |
| `firebase/firebase.js` | identical |
| `services/phoneUtils.js` | identical |
| `services/authService.js` | identical |
| `auth/roles.js` | identical |
| `auth/login.js` | may diverge: C-stu serves students only, C-adm serves staff only |

**Cache-busting bug to fix:** modules are imported with mismatched query strings
(`auth/login.js?v=login3` in HTML vs `?v=login2` inside `auth/guard.js`), which loads
**two live instances of the same module**. After the change every import of a shared
module must use **one** version string per repo.

---

## 6. End-to-end flow being implemented

**Website (A):** form (name, phone, email, plan, message) — **no seat map** → writes a
`visitors` row with `source:"Website"` → success panel offers
*"Complete your seat booking →"* which opens the student portal in a **new tab**.

**Portal (C-stu), first visit only:**
```
Sign Up (mobile OR email as ID + chosen password)
 → 1 details  → 2 Aadhaar front/back/selfie  → 3 plan
 → 4 seat map (only if seatPreference)       → 5 payment (Pay Later date | Pay Now QR+txn+screenshot)
 → submitted → "Pending admin approval"
```

**Admin (C-adm):** sees the website lead in **Visitors**, sees the pending application in
the approval queue with every detail + document + seat + payment, approves →
`students/{uid}` flips to `Active/Approved`, seat becomes `Occupied`.

**Thereafter:** portal login goes straight to the dashboard. The wizard never reappears.
