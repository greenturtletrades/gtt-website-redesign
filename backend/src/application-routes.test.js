const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.FORM_RATE_LIMIT_MAX = "1000";
process.env.EMAIL_NOTIFY_TO = "team@gtt.local";

const MB = 1024 * 1024;

const prismaMock = {
  traderApplication: {},
  traderApplicationFile: {},
  investorEnquiry: {},
};

const storageMock = {};
const sentEmails = [];

function mockModule(relativePath, exports) {
  const resolved = require.resolve(relativePath);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

mockModule("./db/prisma", { prisma: prismaMock });
mockModule("./services/email", { sendEmail: async (message) => { sentEmails.push(message); return { ok: true }; } });
mockModule("./services/file-storage", {
  isFileStorageConfigured: () => storageMock.configured,
  buildStorageKey: (prefix, extension) => `${prefix}/test/${storageMock.keyCounter++}${extension}`,
  putPrivateObject: (...args) => storageMock.putPrivateObject(...args),
  deleteObject: (...args) => storageMock.deleteObject(...args),
  getDownloadUrl: async (key, fileName, expiresIn) => `https://bucket.test/${key}?name=${fileName}&expires=${expiresIn}`,
});

const app = require("./app");

function reset() {
  process.env.TRADER_APPLICATIONS_OPEN = "true";
  delete process.env.INVESTOR_ENQUIRIES_OPEN;
  sentEmails.length = 0;
  storageMock.configured = true;
  storageMock.keyCounter = 1;
  storageMock.puts = [];
  storageMock.deletes = [];
  storageMock.putPrivateObject = async (object) => { storageMock.puts.push(object); };
  storageMock.deleteObject = async (key) => { storageMock.deletes.push(key); };
  prismaMock.traderApplication.create = async ({ data }) => ({
    id: "app-1",
    status: "PENDING",
    submittedAt: new Date(),
    ...data,
    files: undefined,
  });
  prismaMock.traderApplication.findUnique = async () => null;
  prismaMock.traderApplicationFile.findUnique = async () => null;
  prismaMock.investorEnquiry.create = async ({ data }) => ({ id: "enq-1", status: "NEW", ...data });
  prismaMock.investorEnquiry.findMany = async () => [];
  prismaMock.investorEnquiry.findUnique = async () => null;
  prismaMock.investorEnquiry.update = async ({ data }) => ({ id: "enq-1", submittedIp: "1.2.3.4", ...data });
}

test.beforeEach(reset);

async function withServer(run) {
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.once("error", reject);
  });
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function call(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  return { status: response.status, body: await response.json() };
}

function adminHeaders(role = "ADMIN") {
  return { Authorization: `Bearer ${jwt.sign({ sub: "staff-user", role }, process.env.JWT_SECRET)}` };
}

const pdfBytes = (size = 1024) => {
  const buffer = Buffer.alloc(size, 0x20);
  buffer.write("%PDF-1.7\n");
  return buffer;
};
const csvBytes = () => Buffer.from("ticket,symbol,profit\n1,EURUSD,12.5\n");

const validFields = {
  fullName: "Ada Trader",
  email: "Ada@Example.com",
  country: "GB",
  phone: "+44 7700 900000",
  linkedinUrl: "https://linkedin.com/in/ada",
  brokerName: "IC Markets",
  platform: "MT5",
  markets: ["FX", "INDICES"],
  tradingStyle: "DISCRETIONARY",
  historyStartDate: "2024-01-15",
  yearsExperience: "4.5",
  equityRange: "25K_100K",
  returnPct: "38.2",
  maxDrawdownPct: "11.4",
  calcMethod: "Time-weighted from Myfxbook",
  strategySummary: "London session breakouts on majors.",
  holdingPeriod: "DAYS",
  sizingApproach: "1% risk per trade",
  recordType: "LIVE",
  whyGtt: "Access to professional capital.",
  suitability: "Consistent drawdown control.",
  timeCommitment: "20 hours a week.",
  consentAccurate: "true",
  consentPrivacy: "true",
};

function buildApplication({ fields = {}, omit = [], files = {} } = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...validFields, ...fields })) {
    if (omit.includes(key)) continue;
    [].concat(value).forEach((item) => form.append(key, item));
  }
  const allFiles = {
    cv: ["cv.pdf", pdfBytes()],
    brokerStatement: ["statement.pdf", pdfBytes()],
    tradeHistory: ["history.csv", csvBytes()],
    ...files,
  };
  for (const [field, entry] of Object.entries(allFiles)) {
    if (!entry) continue;
    form.append(field, new Blob([entry[1]]), entry[0]);
  }
  return form;
}

test("POST /api/trader/apply stays closed unless TRADER_APPLICATIONS_OPEN is true", async () => {
  delete process.env.TRADER_APPLICATIONS_OPEN;
  await withServer(async (base) => {
    const response = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication() });
    assert.equal(response.status, 403);
  });
});

test("POST /api/trader/apply returns 503 when file storage is not configured", async () => {
  storageMock.configured = false;
  await withServer(async (base) => {
    const response = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication() });
    assert.equal(response.status, 503);
  });
});

test("POST /api/trader/apply stores a valid application with three private files", async () => {
  let created = null;
  prismaMock.traderApplication.create = async (args) => {
    created = args.data;
    return { id: "app-1", status: "PENDING", ...args.data };
  };

  await withServer(async (base) => {
    const response = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication() });
    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.status, "PENDING");
    assert.match(response.body.statusLookupToken, /^[0-9a-f]{48}$/);
  });

  assert.equal(storageMock.puts.length, 3);
  assert.deepEqual(storageMock.puts.map((put) => put.contentType), ["application/pdf", "application/pdf", "text/csv"]);
  assert.equal(created.email, "ada@example.com");
  assert.deepEqual(created.markets, ["FX", "INDICES"]);
  assert.equal(created.equityRange, "FROM_25K_TO_100K");
  assert.equal(created.yearsExperience, 4.5);
  assert.equal(created.historyStartDate.toISOString(), "2024-01-15T00:00:00.000Z");
  assert.ok(created.consentAccurateAt instanceof Date);
  assert.deepEqual(created.files.create.map((file) => file.kind), ["CV", "BROKER_STATEMENT", "TRADE_HISTORY"]);
  assert.equal(created.files.create[0].fileName, "cv.pdf");
  assert.ok(!("accountNumber" in created));

  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(sentEmails.map((email) => email.to).sort(), ["ada@example.com", "team@gtt.local"]);
});

test("POST /api/trader/apply accepts a single market and flags demo records to the team", async () => {
  await withServer(async (base) => {
    const response = await call(base, "/api/trader/apply", {
      method: "POST",
      body: buildApplication({ fields: { markets: "FX", recordType: "DEMO" } }),
    });
    assert.equal(response.status, 200);
  });
  await new Promise((resolve) => setImmediate(resolve));
  const teamEmail = sentEmails.find((email) => email.to === "team@gtt.local");
  assert.match(teamEmail.subject, /\[DEMO RECORD\]/);
});

test("POST /api/trader/apply escapes applicant text in email HTML", async () => {
  await withServer(async (base) => {
    const response = await call(base, "/api/trader/apply", {
      method: "POST",
      body: buildApplication({ fields: { fullName: "<img src=x onerror=alert(1)>" } }),
    });
    assert.equal(response.status, 200);
  });
  await new Promise((resolve) => setImmediate(resolve));
  for (const email of sentEmails) {
    assert.ok(!email.html.includes("<img src=x"), `unescaped HTML in email to ${email.to}`);
    assert.ok(email.html.includes("&lt;img src=x"));
  }
});

test("POST /api/trader/apply rejects missing and invalid fields with the field name", async () => {
  await withServer(async (base) => {
    const missing = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication({ omit: ["brokerName"] }) });
    assert.equal(missing.status, 400);
    assert.equal(missing.body.field, "brokerName");

    const badMarket = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication({ fields: { markets: ["FX", "BONDS"] } }) });
    assert.equal(badMarket.body.field, "markets");

    const future = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication({ fields: { historyStartDate: "2999-01-01" } }) });
    assert.equal(future.body.field, "historyStartDate");

    const noConsent = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication({ omit: ["consentAccurate"] }) });
    assert.equal(noConsent.body.field, "consentAccurate");

    const otherWithoutName = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication({ fields: { platform: "OTHER" } }) });
    assert.equal(otherWithoutName.body.field, "platformOther");

    const noCv = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication({ files: { cv: null } }) });
    assert.equal(noCv.status, 400);
    assert.equal(noCv.body.field, "cv");
  });
  assert.equal(storageMock.puts.length, 0);
});

test("POST /api/trader/apply rejects files whose content does not match their extension", async () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  await withServer(async (base) => {
    const fakePdf = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication({ files: { brokerStatement: ["statement.pdf", png] } }) });
    assert.equal(fakePdf.status, 415);
    assert.equal(fakePdf.body.field, "brokerStatement");

    const wrongType = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication({ files: { cv: ["cv.png", png] } }) });
    assert.equal(wrongType.status, 415);
    assert.equal(wrongType.body.field, "cv");
  });
  assert.equal(storageMock.puts.length, 0);
});

test("POST /api/trader/apply enforces the 10 MB CV and 20 MB evidence limits", async () => {
  await withServer(async (base) => {
    const bigCv = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication({ files: { cv: ["cv.pdf", pdfBytes(11 * MB)] } }) });
    assert.equal(bigCv.status, 413);
    assert.equal(bigCv.body.field, "cv");

    const hugeStatement = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication({ files: { brokerStatement: ["s.pdf", pdfBytes(21 * MB)] } }) });
    assert.equal(hugeStatement.status, 413);
  });
  assert.equal(storageMock.puts.length, 0);
});

test("POST /api/trader/apply removes uploaded files if the database write fails", async () => {
  prismaMock.traderApplication.create = async () => {
    throw new Error("database down");
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    await withServer(async (base) => {
      const response = await call(base, "/api/trader/apply", { method: "POST", body: buildApplication() });
      assert.equal(response.status, 500);
    });
  } finally {
    console.error = originalError;
  }
  assert.equal(storageMock.puts.length, 3);
  assert.deepEqual(storageMock.deletes.sort(), storageMock.puts.map((put) => put.key).sort());
});

const validEnquiry = {
  fullName: "Ivy Investor",
  email: "ivy@fund.example",
  enquiringAs: "ORGANISATION",
  organisation: "Example Capital",
  role: "CIO",
  country: "GB",
  professionalStatus: "YES",
  allocationRange: "250K_1M",
  objectives: "Diversify into systematic FX",
  timing: "3_TO_12_MONTHS",
  consentPrivacy: true,
};

function postEnquiry(base, body) {
  return call(base, "/api/investor/enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST /api/investor/enquiry stores a valid enquiry and maps range values", async () => {
  let created = null;
  prismaMock.investorEnquiry.create = async ({ data }) => {
    created = data;
    return { id: "enq-1", status: "NEW", ...data };
  };
  await withServer(async (base) => {
    const response = await postEnquiry(base, validEnquiry);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { ok: true, id: "enq-1" });
  });
  assert.equal(created.allocationRange, "FROM_250K_TO_1M");
  assert.equal(created.timing, "FROM_3_TO_12_MONTHS");
  assert.equal(created.organisation, "Example Capital");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sentEmails.length, 2);
});

test("POST /api/investor/enquiry ignores organisation fields for individuals", async () => {
  let created = null;
  prismaMock.investorEnquiry.create = async ({ data }) => {
    created = data;
    return { id: "enq-2", ...data };
  };
  await withServer(async (base) => {
    const response = await postEnquiry(base, { ...validEnquiry, enquiringAs: "INDIVIDUAL" });
    assert.equal(response.status, 200);
  });
  assert.equal(created.organisation, null);
  assert.equal(created.role, null);
});

test("POST /api/investor/enquiry rejects invalid input", async () => {
  await withServer(async (base) => {
    const noOrg = await postEnquiry(base, { ...validEnquiry, organisation: "" });
    assert.equal(noOrg.status, 400);
    assert.equal(noOrg.body.field, "organisation");

    const badRange = await postEnquiry(base, { ...validEnquiry, allocationRange: "1B" });
    assert.equal(badRange.body.field, "allocationRange");

    const noConsent = await postEnquiry(base, { ...validEnquiry, consentPrivacy: "yes" });
    assert.equal(noConsent.body.field, "consentPrivacy");

    const badEmail = await postEnquiry(base, { ...validEnquiry, email: "not-an-email" });
    assert.equal(badEmail.body.field, "email");
  });
});

test("POST /api/investor/enquiry can be closed with INVESTOR_ENQUIRIES_OPEN=false", async () => {
  process.env.INVESTOR_ENQUIRIES_OPEN = "false";
  await withServer(async (base) => {
    const response = await postEnquiry(base, validEnquiry);
    assert.equal(response.status, 403);
  });
});

test("GET /api/admin/trader-applications/:id hides the lookup token and storage keys", async () => {
  prismaMock.traderApplication.findUnique = async () => ({
    id: "app-1",
    fullName: "Ada Trader",
    email: "ada@example.com",
    statusLookupToken: "secret-token",
    submittedIp: "1.2.3.4",
    returnPct: { toString: () => "38.20", valueOf: () => 38.2 },
    maxDrawdownPct: null,
    yearsExperience: null,
    historyStartDate: new Date("2024-01-15T00:00:00Z"),
    files: [{ id: "file-1", kind: "CV", fileName: "cv.pdf", size: 10, mimeType: "application/pdf", storageKey: "trader-applications/x.pdf", createdAt: new Date() }],
  });
  await withServer(async (base) => {
    const response = await call(base, "/api/admin/trader-applications/app-1", { headers: adminHeaders() });
    assert.equal(response.status, 200);
    const serialized = JSON.stringify(response.body);
    assert.ok(!serialized.includes("secret-token"));
    assert.ok(!serialized.includes("storageKey"));
    assert.ok(!serialized.includes("1.2.3.4"));
    assert.equal(response.body.application.returnPct, 38.2);
    assert.equal(response.body.application.historyStartDate, "2024-01-15");
  });
});

test("GET /api/admin/trader-applications/:id/files/:fileId only signs files that belong to the application", async () => {
  prismaMock.traderApplicationFile.findUnique = async () => ({
    id: "file-1",
    applicationId: "app-1",
    storageKey: "trader-applications/x.pdf",
    fileName: "cv.pdf",
  });
  const originalInfo = console.info;
  console.info = () => {};
  try {
    await withServer(async (base) => {
      const wrongApplication = await call(base, "/api/admin/trader-applications/app-2/files/file-1", { headers: adminHeaders() });
      assert.equal(wrongApplication.status, 404);

      const ok = await call(base, "/api/admin/trader-applications/app-1/files/file-1", { headers: adminHeaders() });
      assert.equal(ok.status, 200);
      assert.equal(ok.body.expiresInSeconds, 300);
      assert.match(ok.body.url, /^https:\/\/bucket\.test\/trader-applications\/x\.pdf/);

      const trader = await call(base, "/api/admin/trader-applications/app-1/files/file-1", { headers: adminHeaders("TRADER") });
      assert.equal(trader.status, 403);
    });
  } finally {
    console.info = originalInfo;
  }
});

test("PATCH /api/admin/investor-enquiries/:id updates status and validates input", async () => {
  prismaMock.investorEnquiry.findUnique = async () => ({ id: "enq-1" });
  await withServer(async (base) => {
    const patch = (body) => call(base, "/api/admin/investor-enquiries/enq-1", {
      method: "PATCH",
      headers: { ...adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const ok = await patch({ status: "CONTACTED", internalNote: "  Called on Monday  " });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.item.status, "CONTACTED");
    assert.equal(ok.body.item.internalNote, "Called on Monday");
    assert.ok(!("submittedIp" in ok.body.item));

    const bad = await patch({ status: "WON" });
    assert.equal(bad.status, 400);

    const empty = await patch({});
    assert.equal(empty.status, 400);
  });
});
