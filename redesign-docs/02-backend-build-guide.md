# Website redesign: backend build guide

Status as of 20 Oct 2026. Companion to the *GTT Website Design Plan* (13 Oct 2026).

> **Built, 20 Oct 2026.** Everything in sections 2–8 and 10 is now implemented and tested (48 of 48 backend tests
> pass). The retention script (section 9) and the admin dashboard screens (end of section 8) are not built yet.
> See *Implementation notes* at the end for where everything lives and how it differs from the plan below.

The frontend for the redesign is built on branch `feat/website-redesign-frontend`. This guide covers everything the
backend needs so the two new forms work end to end: the API contracts the frontend already calls, database
changes, private file storage, emails, admin endpoints, environment variables, tests and rollout order.

Everything here extends the existing backend (`backend/src`, Express + Prisma, CommonJS). Nothing is rebuilt.

---

## 1. What changes, in one table

| Area | Today | After |
| --- | --- | --- |
| `POST /api/trader/apply` | Returns `403` (closed for FCA reasons), JSON body, 6 fields | Reopened behind `TRADER_APPLICATIONS_OPEN`, **multipart** body, ~27 fields + 3 files |
| `POST /api/investor/enquiry` | Does not exist | New, JSON body, 13 fields |
| `TraderApplication` model | `email @unique`, `accountNumber` and `experienceLevel` required | Unique dropped (people can reapply), many new columns, old columns optional |
| `TraderApplicationFile` model | — | New: one row per uploaded file |
| `InvestorEnquiry` model | — | New |
| File storage | — | Private Railway bucket (S3-compatible), signed download links only |
| Admin API | List, approve and reject trader applications | Same plus detail view, file download links, investor enquiry list and status |
| Packages | — | `multer`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` |

Suggested order of work: **database → storage service → trader endpoint → investor endpoint → admin endpoints →
tests → deploy**. Each step below can be a separate commit.

---

## 2. Environment variables

Add to Railway (backend service) and to `backend/.env` locally.

| Variable | Example | Purpose |
| --- | --- | --- |
| `TRADER_APPLICATIONS_OPEN` | `true` | Reopens `POST /api/trader/apply`. Anything other than `"true"` keeps the current 403. |
| `S3_ENDPOINT` | from bucket credentials | Bucket endpoint URL |
| `S3_BUCKET` | `gtt-applications` | Bucket name |
| `S3_REGION` | from bucket credentials | Region string the SDK signs with |
| `S3_ACCESS_KEY_ID` | from bucket credentials | |
| `S3_SECRET_ACCESS_KEY` | from bucket credentials | |
| `APPLICATIONS_NOTIFY_TO` | `team@…` | Who receives new trader applications. Falls back to `EMAIL_NOTIFY_TO`. |
| `ENQUIRIES_NOTIFY_TO` | `team@…` | Who receives investor enquiries. Falls back to `EMAIL_NOTIFY_TO`. |
| `S3_FORCE_PATH_STYLE` | `true` | Optional. Use `bucket-host/bucket/key` URLs instead of `bucket.bucket-host/key`. Set it if uploads fail with a DNS or signature error. |
| `INVESTOR_ENQUIRIES_OPEN` | `false` | Optional. Set to `false` to close the enquiry endpoint (403). Open by default. |
| `FORM_RATE_LIMIT_MAX` | `5` | Optional. Submissions allowed per IP per hour, for each form. Default 5. |

When you create the bucket in the Railway landing-page project, open its **Credentials** tab and copy the values
into the `S3_*` variables (or reference them with Railway variable references). Check there whether the endpoint
needs path-style addressing; if uploads fail with a DNS or signature error, set `forcePathStyle: true` in the client.

Frontend variables (frontend service on Railway):

| Variable | Purpose |
| --- | --- |
| `VITE_INVESTOR_PAGE_LIVE` | `"true"` shows the Professional Investors page, its nav link and footer link. Leave unset until the host signs off the wording. Local `npm run dev` always shows it. |
| `VITE_FORMS_DEMO` | Local only. `"true"` makes both forms show their confirmation screen without calling the API, for previewing. Ignored in production builds. |

---

## 3. Database (Prisma)

### 3.1 Schema changes

In `backend/prisma/schema.prisma`:

```prisma
enum BrokerPlatform {
  MT4
  MT5
  CTRADER
  TRADING212
  OTHER            // new: the form offers "Other" with a free-text name
}

enum TradingStyle {
  DISCRETIONARY
  AUTOMATED
  BOTH
}

enum EquityRange {
  UNDER_5K
  FROM_5K_TO_25K
  FROM_25K_TO_100K
  FROM_100K_TO_500K
  OVER_500K
}

enum HoldingPeriod {
  INTRADAY
  DAYS
  WEEKS
  MONTHS
}

enum TradingRecordType {
  LIVE
  DEMO
  COMPETITION
}

enum TraderApplicationFileKind {
  CV
  BROKER_STATEMENT
  TRADE_HISTORY
}

model TraderApplication {
  id                String                  @id @default(cuid())
  fullName          String
  email             String                  // @unique removed: people can reapply
  statusLookupToken String                  @unique
  country           String                  // ISO 3166-1 alpha-2, e.g. "GB"
  phone             String?
  linkedinUrl       String?

  brokerName        String?
  platform          BrokerPlatform
  platformOther     String?
  markets           String[]                // FX, INDICES, COMMODITIES, EQUITIES, CRYPTO
  tradingStyle      TradingStyle?
  historyStartDate  DateTime?               @db.Date
  yearsExperience   Decimal?                @db.Decimal(4, 1)
  equityRange       EquityRange?

  verifiedRecordUrl String?
  returnPct         Decimal?                @db.Decimal(9, 2)
  maxDrawdownPct    Decimal?                @db.Decimal(5, 2)
  calcMethod        String?
  strategySummary   String?
  holdingPeriod     HoldingPeriod?
  sizingApproach    String?
  recordType        TradingRecordType?

  whyGtt            String?
  suitability       String?
  timeCommitment    String?

  consentAccurateAt DateTime?
  consentPrivacyAt  DateTime?
  submittedIp       String?                 // for abuse investigation only; include in retention rule

  // Legacy columns, kept so old rows stay valid. New rows leave them null.
  accountNumber     String?
  experienceLevel   ExperienceLevel?

  status            TraderApplicationStatus @default(PENDING)
  rejectionReason   String?
  submittedAt       DateTime                @default(now())
  reviewedAt        DateTime?

  files             TraderApplicationFile[]

  @@index([status])
  @@index([email])
  @@index([recordType])
}

model TraderApplicationFile {
  id            String                    @id @default(cuid())
  applicationId String
  application   TraderApplication         @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  kind          TraderApplicationFileKind
  storageKey    String                    @unique
  fileName      String                    // original name, for display only; never used as a path
  size          Int
  mimeType      String
  createdAt     DateTime                  @default(now())

  @@index([applicationId])
}

enum EnquiringAs {
  INDIVIDUAL
  ORGANISATION
}

enum ProfessionalStatusAnswer {
  YES
  NO
  NOT_SURE
}

enum AllocationRange {
  UNDER_50K
  FROM_50K_TO_250K
  FROM_250K_TO_1M
  OVER_1M
}

enum EnquiryTiming {
  WITHIN_3_MONTHS
  FROM_3_TO_12_MONTHS
  EXPLORING
}

enum InvestorEnquiryStatus {
  NEW
  CONTACTED
  CLOSED
}

model InvestorEnquiry {
  id                 String                   @id @default(cuid())
  fullName           String
  email              String
  phone              String?
  enquiringAs        EnquiringAs
  organisation       String?
  role               String?
  country            String
  professionalStatus ProfessionalStatusAnswer
  allocationRange    AllocationRange
  objectives         String
  timing             EnquiryTiming
  message            String?
  consentPrivacyAt   DateTime
  status             InvestorEnquiryStatus    @default(NEW)
  internalNote       String?
  submittedIp        String?
  createdAt          DateTime                 @default(now())
  updatedAt          DateTime                 @updatedAt

  @@index([status])
  @@index([email])
}
```

**Enum value mapping.** Prisma enum values can't start with a digit, but the frontend sends values such as
`5K_25K`. Map them at the API boundary rather than changing the frontend:

```js
const equityRangeMap = {
  UNDER_5K: "UNDER_5K",
  "5K_25K": "FROM_5K_TO_25K",
  "25K_100K": "FROM_25K_TO_100K",
  "100K_500K": "FROM_100K_TO_500K",
  OVER_500K: "OVER_500K",
};
const allocationRangeMap = {
  UNDER_50K: "UNDER_50K",
  "50K_250K": "FROM_50K_TO_250K",
  "250K_1M": "FROM_250K_TO_1M",
  OVER_1M: "OVER_1M",
};
const timingMap = {
  WITHIN_3_MONTHS: "WITHIN_3_MONTHS",
  "3_TO_12_MONTHS": "FROM_3_TO_12_MONTHS",
  EXPLORING: "EXPLORING",
};
```

An unknown key maps to `undefined`, so the lookup also serves as validation.

### 3.2 Migration

```bash
cd backend
npx prisma migrate dev --name website_redesign_forms
```

Check the generated SQL before committing:

- `DROP INDEX "TraderApplication_email_key"`: expected.
- `ALTER COLUMN "accountNumber" DROP NOT NULL` and the same for `experienceLevel`: expected.
- `ALTER TYPE "BrokerPlatform" ADD VALUE 'OTHER'`: expected. On older Postgres this can't run inside a transaction
  with other statements; if `migrate deploy` complains, split it into its own migration.
- There must be **no** `DROP COLUMN`. Existing rows must survive.

### 3.3 Code that assumes one application per email

Dropping `@unique` breaks two places, which you need to fix in the same change:

1. `public-routes.js`: the old handler `upsert`s by email. The new handler always `create`s.
2. `admin-routes.js`: around line 347, `applicationsByEmail` is built with `new Map(applications.map(...))`
   from a list ordered `submittedAt desc`. With duplicates, `Map` keeps the **last** entry, which is the
   **oldest** application. Change it to keep the first (newest) entry:

   ```js
   const applicationsByEmail = new Map();
   for (const application of applications) {
     const key = application.email.trim().toLowerCase();
     if (!applicationsByEmail.has(key)) applicationsByEmail.set(key, application);
   }
   ```

   The signup-review list (around line 1248) maps each application to one row, so duplicates show as separate
   rows, which is the behaviour you want there.

---

## 4. File storage service

New file `backend/src/services/file-storage.js`:

```js
const crypto = require("crypto");
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

let client = null;

function getClient() {
  if (client) return client;
  const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error("File storage is not configured (S3_* variables missing).");
  }
  client = new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION || "auto",
    credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  });
  return client;
}

function buildStorageKey(prefix, extension) {
  // Never use the uploaded file name in the key.
  return `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension}`;
}

async function putPrivateObject({ key, body, contentType }) {
  await getClient().send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

async function deleteObject(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
}

function getDownloadUrl(key, fileName, expiresIn = 300) {
  const safeName = String(fileName).replace(/[^\w.\- ]+/g, "_");
  return getSignedUrl(getClient(), new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${safeName}"`,
  }), { expiresIn });
}

module.exports = { buildStorageKey, putPrivateObject, deleteObject, getDownloadUrl };
```

Rules:

- The bucket is private. No public URLs, ever.
- Downloads go only through `getDownloadUrl`, which signs a link that expires after 5 minutes and forces a download
  (`attachment`) so a crafted file can't render in the browser on your domain.
- Keys are random. The original file name is stored in the database for display only.

---

## 5. `POST /api/trader/apply`

### 5.1 Request

`Content-Type: multipart/form-data`. Sent by `frontend/src/api/traderApplication.ts`.

Text fields. All values arrive as strings, so convert them.

| Field | Required | Validation |
| --- | --- | --- |
| `fullName` | yes | trimmed, 1–200 chars |
| `email` | yes | valid email, lower-cased, ≤ 254 chars |
| `country` | yes | 2-letter ISO code, `/^[A-Z]{2}$/` |
| `phone` | no | ≤ 40 chars, `/^[+\d ()\-]+$/` |
| `linkedinUrl` | no | `http(s)://` URL, ≤ 500 chars |
| `brokerName` | yes | 1–120 chars |
| `platform` | yes | `MT4` \| `MT5` \| `CTRADER` \| `OTHER` |
| `platformOther` | if `platform=OTHER` | 1–80 chars |
| `markets` | yes | repeated field; each one of `FX`, `INDICES`, `COMMODITIES`, `EQUITIES`, `CRYPTO`; at least 1 |
| `tradingStyle` | yes | `DISCRETIONARY` \| `AUTOMATED` \| `BOTH` |
| `historyStartDate` | yes | `YYYY-MM-DD`, not in the future, not before 1990 |
| `yearsExperience` | yes | number 0–60 |
| `equityRange` | yes | key of `equityRangeMap` |
| `verifiedRecordUrl` | no | `http(s)://` URL, ≤ 500 chars |
| `returnPct` | yes | finite number, -100 to 100000 |
| `maxDrawdownPct` | yes | number 0–100 |
| `calcMethod` | yes | 1–300 chars |
| `strategySummary` | yes | 1–4000 chars |
| `holdingPeriod` | yes | `INTRADAY` \| `DAYS` \| `WEEKS` \| `MONTHS` |
| `sizingApproach` | yes | 1–300 chars |
| `recordType` | yes | `LIVE` \| `DEMO` \| `COMPETITION` |
| `whyGtt`, `suitability`, `timeCommitment` | yes | 1–600 chars each (the form enforces 600 too) |
| `consentAccurate`, `consentPrivacy` | yes | must equal the string `"true"`; store as timestamps |

Note on `markets`: with multer, a field sent once arrives as a string and a repeated field as an array. Normalise:
`const markets = [].concat(req.body.markets || [])`.

Files:

| Field | Required | Allowed | Max size | Content check |
| --- | --- | --- | --- | --- |
| `cv` | yes | `.pdf`, `.doc`, `.docx` | 10 MB | PDF `%PDF-`; DOC OLE header `D0 CF 11 E0`; DOCX ZIP `PK\x03\x04` |
| `brokerStatement` | yes | `.pdf` | 20 MB | `%PDF-` |
| `tradeHistory` | yes | `.csv`, `.xlsx` | 20 MB | XLSX `PK\x03\x04`; CSV: no NUL bytes in the first 8 KB and decodes as UTF-8 |

Check both the extension and the first bytes. Ignore the browser's `mimetype`, because the client sets it. Store the
MIME type you derive from the extension after the content check passes.

### 5.2 Responses

The frontend reads `status` and `error` (see `describeSubmitError` in `TraderApplicationPage.tsx`).

| Status | Body | When |
| --- | --- | --- |
| `200` | `{ ok: true, id, status: "PENDING", statusLookupToken }` | Saved |
| `400` | `{ ok: false, error: "<human sentence>", field?: "<fieldName>" }` | Validation failed. Write `error` so it can be shown to the applicant as is. |
| `403` | `{ ok: false, error: "Trader applications are currently closed." }` | `TRADER_APPLICATIONS_OPEN !== "true"` |
| `413` | `{ ok: false, error: "…" }` | A file exceeds its limit. The frontend then shows the "email us for a private upload link" message. |
| `415` | `{ ok: false, error: "…" }` | File type or content doesn't match |
| `429` | `{ ok: false, error: "…" }` + `Retry-After` | Rate limited |
| `500` | `{ ok: false, error: "…" }` | Storage or database failure |

### 5.3 Wiring

`rateLimit` lives in `app.js` and isn't passed to `registerPublicRoutes` yet. Pass it in, along with the storage
helpers:

```js
// app.js
const fileStorage = require("./services/file-storage");

registerPublicRoutes(app, {
  prisma,
  sendEmail,
  env: process.env,
  brokerPlatforms,
  experienceLevels,
  rateLimit,
  fileStorage,
});
```

`express.json()` runs globally but ignores multipart bodies, so multer can parse them on this one route. The CSRF
middleware only checks requests that carry a session cookie, so anonymous applicants pass. A logged-in Turtle
Analytics user applying from the same browser needs an allowed `Origin`, which they will have on the real site.

### 5.4 Handler skeleton

```js
// public-routes.js
const multer = require("multer");

const MB = 1024 * 1024;
const traderUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * MB, files: 3, fields: 60, fieldSize: 8 * 1024 },
}).fields([
  { name: "cv", maxCount: 1 },
  { name: "brokerStatement", maxCount: 1 },
  { name: "tradeHistory", maxCount: 1 },
]);

const fileRules = {
  cv: { kind: "CV", maxBytes: 10 * MB, types: { ".pdf": "application/pdf", ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } },
  brokerStatement: { kind: "BROKER_STATEMENT", maxBytes: 20 * MB, types: { ".pdf": "application/pdf" } },
  tradeHistory: { kind: "TRADE_HISTORY", maxBytes: 20 * MB, types: { ".csv": "text/csv", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } },
};

function sniffMatchesExtension(buffer, extension) {
  const head = buffer.subarray(0, 8);
  if (extension === ".pdf") return head.subarray(0, 5).toString("latin1") === "%PDF-";
  if (extension === ".docx" || extension === ".xlsx") return head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
  if (extension === ".doc") return head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0;
  if (extension === ".csv") {
    const sample = buffer.subarray(0, 8192);
    if (sample.includes(0)) return false;
    try { new TextDecoder("utf-8", { fatal: true }).decode(sample); return true; } catch { return false; }
  }
  return false;
}

function runTraderUpload(req, res, next) {
  traderUpload(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ ok: false, error: "A file is larger than 20 MB." });
    if (err instanceof multer.MulterError) return res.status(400).json({ ok: false, error: "The upload could not be read." });
    return next(err);
  });
}

app.post(
  "/api/trader/apply",
  (req, res, next) => (env.TRADER_APPLICATIONS_OPEN === "true"
    ? next()
    : res.status(403).json({ ok: false, error: "Trader applications are currently closed." })),
  rateLimit({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: "trader-apply", message: "Too many applications from this connection. Please try again later." }),
  runTraderUpload,
  async (req, res, next) => {
    const uploadedKeys = [];
    try {
      // 1. Validate text fields (table in 5.1). Return 400 with a readable `error` and the `field` name.
      // 2. Validate files:
      const files = [];
      for (const [field, rule] of Object.entries(fileRules)) {
        const file = req.files?.[field]?.[0];
        if (!file) return res.status(400).json({ ok: false, field, error: "Please attach all required files." });
        const extension = (file.originalname.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
        if (!rule.types[extension] || !sniffMatchesExtension(file.buffer, extension)) {
          return res.status(415).json({ ok: false, field, error: `That ${field === "cv" ? "CV" : "file"} isn't a type we accept.` });
        }
        if (file.size > rule.maxBytes) {
          return res.status(413).json({ ok: false, field, error: `The file is larger than ${rule.maxBytes / MB} MB.` });
        }
        files.push({ field, rule, file, extension });
      }

      // 3. Upload to storage first, then write the database in one transaction.
      for (const item of files) {
        item.key = fileStorage.buildStorageKey("trader-applications", item.extension);
        await fileStorage.putPrivateObject({ key: item.key, body: item.file.buffer, contentType: item.rule.types[item.extension] });
        uploadedKeys.push(item.key);
      }

      const statusLookupToken = crypto.randomBytes(24).toString("hex");
      const now = new Date();
      const application = await prisma.traderApplication.create({
        data: {
          /* validated fields… */
          statusLookupToken,
          consentAccurateAt: now,
          consentPrivacyAt: now,
          files: {
            create: files.map(({ rule, file, key, extension }) => ({
              kind: rule.kind,
              storageKey: key,
              fileName: file.originalname.slice(0, 200),
              size: file.size,
              mimeType: rule.types[extension],
            })),
          },
        },
      });

      // 4. Emails (section 7). Don't await; log failures.
      return res.json({ ok: true, id: application.id, status: application.status, statusLookupToken });
    } catch (err) {
      // Don't leave orphaned files if the database write failed.
      await Promise.allSettled(uploadedKeys.map((key) => fileStorage.deleteObject(key)));
      return next(err);
    }
  }
);
```

Delete the old handler body that currently sits below the early `return res.status(403)`, since it is
unreachable.

### 5.5 Security checklist for this endpoint

- [ ] Never accept or store passwords, investor passwords or API keys. There are no such fields. Don't add any.
- [ ] Escape every user value inserted into email HTML (section 7). The existing handlers don't do this yet.
- [ ] Don't log request bodies or file contents.
- [ ] `fileName` is display only. It is never used for paths, keys or `Content-Disposition` without cleaning.
- [ ] Rate limit before multer runs, so rejected requests don't buffer 60 MB.
- [ ] Rely on the Redis-backed limiter. The in-memory fallback is per instance.

---

## 6. `POST /api/investor/enquiry`

JSON body, sent by `frontend/src/api/investorEnquiry.ts`. No files, ever.

| Field | Required | Validation |
| --- | --- | --- |
| `fullName` | yes | 1–200 chars |
| `email` | yes | valid email, lower-cased |
| `phone` | no | as for traders |
| `enquiringAs` | yes | `INDIVIDUAL` \| `ORGANISATION` |
| `organisation`, `role` | if `ORGANISATION` | 1–200 chars each; ignore them for individuals |
| `country` | yes | 2-letter ISO code |
| `professionalStatus` | yes | `YES` \| `NO` \| `NOT_SURE` |
| `allocationRange` | yes | key of `allocationRangeMap` |
| `objectives` | yes | 1–500 chars |
| `timing` | yes | key of `timingMap` |
| `message` | no | ≤ 3000 chars |
| `consentPrivacy` | yes | `true` (boolean) |

Responses: `200 { ok: true, id }`, `400 { ok: false, error }`, `429`.

Rate limit: `rateLimit({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: "investor-enquiry", … })`.

The answer to "existing professional client classification" is the enquirer's own claim. Store it, but never
treat it as categorisation. Nothing in the code should change behaviour based on it.

Should this endpoint follow `VITE_INVESTOR_PAGE_LIVE`? The page is hidden until sign-off, so nobody reaches the form.
Add `INVESTOR_ENQUIRIES_OPEN` (same pattern as traders) if you want the API closed too.

---

## 7. Emails

Use the existing `sendEmail` from `services/email.js`. Send without awaiting, catch errors and log them, the way the
current handlers do.

Add an escape helper and use it for **every** interpolated value:

```js
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
```

### Trader application

1. **To the applicant.** Subject: *We've received your application*.
   Body (wording from the design plan):
   > Thanks, we've received your application. We will review your CV and records, verify your trading history and
   > contact you within 10 working days if we'd like to discuss your strategy. Applying does not guarantee
   > selection, a contract or investor capital.

   Include the status lookup token, as today.
2. **To the team** (`APPLICATIONS_NOTIFY_TO || EMAIL_NOTIFY_TO`). Subject:
   `New trader application: <name> (<recordType>)`. Include name, email, country, platform, record type,
   return and drawdown, and a link to `${APP_URL}/admin` (the admin dashboard). **Don't attach files**: they stay in
   the bucket. Mark `DEMO` and `COMPETITION` records clearly in the subject, as the plan asks.

### Investor enquiry

1. **To the enquirer.** Subject: *Thank you for your enquiry*.
   > Thank you for your enquiry. A member of the GTT team will contact you to discuss the service and next steps.
   > Access depends on assessment and client categorisation by the regulated firm. This enquiry does not establish
   > eligibility.
2. **To the team** (`ENQUIRIES_NOTIFY_TO || EMAIL_NOTIFY_TO`): every field, with `replyTo` set to the enquirer.

---

## 8. Admin endpoints

All use the existing `authRequired, adminRequired` middleware. Writes should also use `staffWriteRequired`, as the
other admin write routes do.

### Trader applications

| Method and path | Change |
| --- | --- |
| `GET /api/admin/trader-applications?status=&recordType=` | Add `recordType`, `platform`, `returnPct`, `maxDrawdownPct`, `historyStartDate` to `select`. Allow filtering by `recordType`. Convert `Decimal` with `Number()` before `res.json`. |
| `GET /api/admin/trader-applications/:id` | **New.** Full application plus `files: [{ id, kind, fileName, size, mimeType, createdAt }]`. Never return `storageKey`. |
| `GET /api/admin/trader-applications/:id/files/:fileId` | **New.** Checks that the file belongs to the application, then returns `{ ok: true, url, expiresInSeconds: 300 }` from `getDownloadUrl`. Logs which admin downloaded which file (admin id, file id, time). |
| `POST /api/admin/trader-applications/:id/approve` and `/reject` | Unchanged. |

### Investor enquiries

| Method and path | Purpose |
| --- | --- |
| `GET /api/admin/investor-enquiries?status=` | List, newest first |
| `PATCH /api/admin/investor-enquiries/:id` | Body `{ status?: "NEW" \| "CONTACTED" \| "CLOSED", internalNote?: string }` |

Admin UI: `frontend/src/components/admin/AdminDashboard.tsx` and `TraderDetailsModal.tsx` need a detail view with
the new fields, a download button per file (it calls the file endpoint, then `window.open(url)`), a badge for demo and
competition records, and a new *Investor enquiries* tab. Add the matching helpers to `frontend/src/api/admin.ts`.

---

## 9. Retention

The plan's default is to delete rejected applicants' files after 12 months. That isn't agreed yet, so add it to the
privacy notice once it is. Implementation:

- A script `backend/scripts/purge-rejected-application-files.js` that finds `REJECTED` applications with
  `reviewedAt < now - 12 months`, deletes their bucket objects, then deletes the `TraderApplicationFile` rows (and
  optionally clears free-text answers).
- Run it monthly with a Railway cron service, or by hand at first.
- A deletion request from an applicant runs the same steps for that one application.

---

## 10. Tests

`backend/src/app.test.js` already has `POST /api/trader/apply and /api/waitlist are closed`. Update it and add:

1. Applications stay closed (403) when `TRADER_APPLICATIONS_OPEN` is unset.
2. A valid multipart application with small fixture files returns 200 and creates one application and three file
   rows. Stub `fileStorage` in the test.
3. Missing required field → 400 with `field`.
4. A `.pdf` whose bytes are actually a PNG → 415.
5. A CV over 10 MB (but under 20 MB) → 413.
6. Reapplying with the same email creates a second row (the unique constraint is gone).
7. A storage failure → 500, and no database row is left behind.
8. Valid investor enquiry → 200. An organisation with no `organisation` → 400. A bad `allocationRange` → 400.
9. The admin file endpoint returns 404 for a file id that belongs to a different application.

Manual checks from the plan: submit each form with good and bad data, try a wrong type and an oversize file, check that
both emails arrive, and check the pages at iPhone width and on desktop.

---

## 11. Rollout

| Step | Who | Notes |
| --- | --- | --- |
| 1. Create a private bucket in the Railway landing-page project | Toni | Copy credentials into `S3_*` |
| 2. Merge backend (migration runs on deploy via `prisma migrate deploy`) | Toni | `TRADER_APPLICATIONS_OPEN` still unset, so the endpoint stays closed |
| 3. Merge frontend | Toni | `/traders` is live; the apply form shows "applications not open yet" if submitted |
| 4. Set `TRADER_APPLICATIONS_OPEN=true` | Toni, after host agrees | The design plan records that applications can reopen |
| 5. Submit a real test application in production, download each file from admin, delete the test | Toni | Also open a file's link with everything after `?` removed: the bucket must refuse it (403). The local s3rver stand-in doesn't check this, so it has to be tested on the real bucket. |
| 6. Host signs off the investor page wording | Host | Financial promotion |
| 7. Set `VITE_INVESTOR_PAGE_LIVE=true` on the frontend and redeploy | Toni | Vite reads it at build time, so a redeploy is required |
| 8. Add `/professional-investors` to `frontend/public/sitemap.xml` and the SEO pre-render list | Toni | Deliberately left out until step 7 |

---

## 12. Open questions that affect the backend

| Question | Default used in the code | Where to change it |
| --- | --- | --- |
| Which email receives applications and enquiries? | `EMAIL_NOTIFY_TO` | `APPLICATIONS_NOTIFY_TO`, `ENQUIRIES_NOTIFY_TO` |
| Promised response time | 10 working days | Confirmation email and `TraderApplicationPage.tsx` |
| Supported platforms | MT4, MT5, cTrader, Other | `platformOptions` in `TraderApplicationPage.tsx` and `BrokerPlatform` enum |
| Retention for rejected applicants | 12 months | Purge script and privacy notice |
| Large-file route | Applicant emails `contact@greenturtletraders.co.uk` | `LARGE_FILE_EMAIL` in `TraderApplicationPage.tsx`. A later version could issue a signed **upload** URL by email. |
| Fees shown publicly before host agreement? | Shown, labelled *Proposed terms, subject to host* | `ProfessionalInvestorsPage.tsx`, `TradersPage.tsx` |

---

## Appendix: frontend files that talk to the backend

| File | Calls |
| --- | --- |
| `frontend/src/api/traderApplication.ts` | `POST /api/trader/apply` (multipart), `GET /api/trader/application?token=` |
| `frontend/src/api/investorEnquiry.ts` | `POST /api/investor/enquiry` |
| `frontend/src/api/client.ts` | New `apiPostForm` for multipart (doesn't set `Content-Type`, so the browser adds the boundary) |
| `frontend/src/components/marketing/TraderApplicationPage.tsx` | Error handling per status code: 403, 413, 429, other |
| `frontend/src/components/marketing/InvestorEnquiryPage.tsx` | Error handling: 429, other |
| `frontend/src/featureFlags.ts` | `VITE_INVESTOR_PAGE_LIVE`, `VITE_FORMS_DEMO` |

---

## Implementation notes (20 Oct 2026)

### Where everything lives

| File | What it does |
| --- | --- |
| `backend/prisma/schema.prisma` | New enums, extended `TraderApplication`, new `TraderApplicationFile` and `InvestorEnquiry` |
| `backend/prisma/migrations/20261020120000_website_redesign_forms/migration.sql` | The migration (hand-written; see below) |
| `backend/src/routes/application-routes.js` | `POST /api/trader/apply`, `POST /api/investor/enquiry`, the two new trader-application admin endpoints, and both investor-enquiry admin endpoints |
| `backend/src/services/application-forms.js` | Field validation, enum mapping, file type and content checks |
| `backend/src/services/file-storage.js` | Bucket upload, delete and signed download links |
| `backend/src/services/html.js` | `escapeHtml` for email HTML |
| `backend/src/routes/admin-routes.js` | Trader application list: new fields, `recordType` filter, `fileCount`; newest-application-per-email fix |
| `backend/src/routes/public-routes.js` | Old unreachable `/api/trader/apply` handler removed |
| `backend/src/application-routes.test.js` | 16 tests for the above; `npm test` runs it with the existing suite |

### Differences from the plan above

- **Storage not configured → 503.** If applications are open but the `S3_*` variables are missing, the endpoint
  returns 503 with "Applications can't be accepted right now" instead of failing after the upload.
- **Validation errors follow form order**, so the `field` returned is the first problem on screen.
- **Download audit** is a log line (`[audit] admin <id> downloaded application file <id>`) in the Railway logs, not
  a database table.
- **Admin detail** also hides `submittedIp`. The investor enquiry list and PATCH responses hide it too.
- **Investor enquiry list** returns at most 500 rows, newest first.

### How the migration was checked

Prisma 7's `migrate diff` returned empty output in this setup, and no local Postgres was available, so the SQL was
written by hand in Prisma's format. It was then tested in an in-memory Postgres (PGlite):

1. All 29 existing migrations applied.
2. An old-style application row inserted.
3. The new migration applied inside a transaction.
4. Checked: the old row survives, the same email can apply twice, deleting an application deletes its file rows, and
   an enquiry inserts.

**Before deploying**, run this against a copy of the real database (or a Railway preview environment). It reports
any gap between the hand-written SQL and the schema:

```bash
cd backend
npx prisma migrate deploy
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

The second command should print nothing. If it prints SQL, the schema and migration disagree; fix the migration
before going to production.

### Still to do

1. Admin dashboard screens (application detail, file downloads, investor enquiries tab) and their helpers in
   `frontend/src/api/admin.ts`.
2. Retention script (section 9), once the retention period is agreed.
3. Create the bucket and set the variables (section 2), then follow the rollout steps (section 11).
