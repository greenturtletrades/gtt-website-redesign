// Validation for the public trader application and investor enquiry forms.
// Each parser returns { data } on success or { error: { field, message } } on the first problem.
// Messages are written to be shown to the applicant as they are.

const MB = 1024 * 1024;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const countryPattern = /^[A-Z]{2}$/;
const phonePattern = /^[+\d ()\-]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const traderPlatforms = new Set(["MT4", "MT5", "CTRADER", "OTHER"]);
const tradingMarkets = new Set(["FX", "INDICES", "COMMODITIES", "EQUITIES", "CRYPTO"]);
const tradingStyles = new Set(["DISCRETIONARY", "AUTOMATED", "BOTH"]);
const holdingPeriods = new Set(["INTRADAY", "DAYS", "WEEKS", "MONTHS"]);
const recordTypes = new Set(["LIVE", "DEMO", "COMPETITION"]);
const enquiringAsValues = new Set(["INDIVIDUAL", "ORGANISATION"]);
const professionalStatusValues = new Set(["YES", "NO", "NOT_SURE"]);

// Prisma enum values can't start with a digit, so the form's values are mapped here.
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

const traderFileRules = {
  cv: {
    kind: "CV",
    label: "CV",
    maxBytes: 10 * MB,
    types: {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  },
  brokerStatement: {
    kind: "BROKER_STATEMENT",
    label: "broker statement",
    maxBytes: 20 * MB,
    types: { ".pdf": "application/pdf" },
  },
  tradeHistory: {
    kind: "TRADE_HISTORY",
    label: "trade history export",
    maxBytes: 20 * MB,
    types: {
      ".csv": "text/csv",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  },
};

class FormError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
  }
}

function fail(field, message) {
  throw new FormError(field, message);
}

function text(body, field, { required = true, max, min = 1, message } = {}) {
  const raw = body[field];
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    if (required) fail(field, message || "This field is required.");
    return null;
  }
  if (value.length < min) fail(field, message || "This answer is too short.");
  if (max && value.length > max) fail(field, `Keep this under ${max} characters.`);
  return value;
}

function email(body, field = "email") {
  const value = text(body, field, { max: 254, message: "Enter a valid email address." });
  if (!emailPattern.test(value)) fail(field, "Enter a valid email address.");
  return value.toLowerCase();
}

function country(body, field = "country") {
  const value = text(body, field, { message: "Select a country." });
  if (!countryPattern.test(value)) fail(field, "Select a country from the list.");
  return value;
}

function phone(body) {
  const value = text(body, "phone", { required: false, max: 40 });
  if (value && !phonePattern.test(value)) fail("phone", "Enter a phone number using digits, spaces and +.");
  return value;
}

function url(body, field) {
  const value = text(body, field, { required: false, max: 500 });
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
  } catch {
    fail(field, "Enter a full web address starting with https://.");
  }
  return value;
}

function oneOf(body, field, allowed, message) {
  const value = typeof body[field] === "string" ? body[field].trim() : "";
  if (!allowed.has(value)) fail(field, message);
  return value;
}

function mapped(body, field, map, message) {
  const value = typeof body[field] === "string" ? body[field].trim() : "";
  const result = Object.prototype.hasOwnProperty.call(map, value) ? map[value] : undefined;
  if (!result) fail(field, message);
  return result;
}

function number(body, field, { min, max, message }) {
  const raw = typeof body[field] === "string" ? body[field].trim() : body[field];
  const value = typeof raw === "number" ? raw : raw === "" || raw == null ? NaN : Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) fail(field, message);
  return value;
}

function isTrue(value) {
  return value === true || value === "true";
}

function parseTraderApplication(body = {}, now = new Date()) {
  try {
    // Checked in the same order as the form, so the first error matches the first field on screen.
    const fullName = text(body, "fullName", { max: 200, message: "Enter your full name." });
    const emailValue = email(body);
    const countryValue = country(body);
    const phoneValue = phone(body);
    const linkedinUrl = url(body, "linkedinUrl");
    const brokerName = text(body, "brokerName", { max: 120, message: "Enter the name of your broker." });
    const platform = oneOf(body, "platform", traderPlatforms, "Select your trading platform.");
    const platformOther = platform === "OTHER" ? text(body, "platformOther", { max: 80, message: "Tell us which platform you use." }) : null;
    const markets = [...new Set([].concat(body.markets || []).map((item) => String(item).trim()))];
    if (!markets.length || markets.some((market) => !tradingMarkets.has(market))) {
      fail("markets", "Select at least one market from the list.");
    }
    const tradingStyle = oneOf(body, "tradingStyle", tradingStyles, "Select your trading style.");
    const historyStart = text(body, "historyStartDate", { message: "Enter the date your live history starts." });
    const historyStartDate = datePattern.test(historyStart) ? new Date(`${historyStart}T00:00:00Z`) : null;
    if (!historyStartDate || Number.isNaN(historyStartDate.getTime())) fail("historyStartDate", "Enter a valid date.");
    if (historyStartDate > now) fail("historyStartDate", "The start date can't be in the future.");
    if (historyStartDate < new Date("1990-01-01T00:00:00Z")) fail("historyStartDate", "Enter a start date after 1990.");

    const data = {
      fullName,
      email: emailValue,
      country: countryValue,
      phone: phoneValue,
      linkedinUrl,
      brokerName,
      platform,
      platformOther,
      markets,
      tradingStyle,
      historyStartDate,
      yearsExperience: number(body, "yearsExperience", { min: 0, max: 60, message: "Enter your years of trading experience (0–60)." }),
      equityRange: mapped(body, "equityRange", equityRangeMap, "Select your approximate account equity."),
      verifiedRecordUrl: url(body, "verifiedRecordUrl"),
      returnPct: number(body, "returnPct", { min: -100, max: 100000, message: "Enter your historical return as a percentage." }),
      maxDrawdownPct: number(body, "maxDrawdownPct", { min: 0, max: 100, message: "Enter your maximum drawdown between 0 and 100." }),
      calcMethod: text(body, "calcMethod", { max: 300, message: "Tell us how you calculated these figures." }),
      strategySummary: text(body, "strategySummary", { max: 4000, message: "Describe your strategy." }),
      holdingPeriod: oneOf(body, "holdingPeriod", holdingPeriods, "Select your typical holding period."),
      sizingApproach: text(body, "sizingApproach", { max: 300, message: "Describe how you size positions." }),
      recordType: oneOf(body, "recordType", recordTypes, "Select the type of record you're submitting."),
      whyGtt: text(body, "whyGtt", { max: 600, message: "Answer this question." }),
      suitability: text(body, "suitability", { max: 600, message: "Answer this question." }),
      timeCommitment: text(body, "timeCommitment", { max: 600, message: "Answer this question." }),
      consentAccurateAt: now,
      consentPrivacyAt: now,
    };
    if (!isTrue(body.consentAccurate)) fail("consentAccurate", "Confirm your record is accurate and that you may share it.");
    if (!isTrue(body.consentPrivacy)) fail("consentPrivacy", "Confirm you have read the privacy notice.");
    return { data };
  } catch (error) {
    if (error instanceof FormError) return { error: { field: error.field, message: error.message } };
    throw error;
  }
}

function parseInvestorEnquiry(body = {}, now = new Date()) {
  try {
    const enquiringAs = oneOf(body, "enquiringAs", enquiringAsValues, "Tell us whether you're enquiring as an individual or an organisation.");
    const isOrganisation = enquiringAs === "ORGANISATION";

    const data = {
      fullName: text(body, "fullName", { max: 200, message: "Enter your full name." }),
      email: email(body),
      phone: phone(body),
      enquiringAs,
      organisation: isOrganisation ? text(body, "organisation", { max: 200, message: "Enter your organisation's name." }) : null,
      role: isOrganisation ? text(body, "role", { max: 200, message: "Enter your role." }) : null,
      country: country(body),
      professionalStatus: oneOf(body, "professionalStatus", professionalStatusValues, "Select an answer."),
      allocationRange: mapped(body, "allocationRange", allocationRangeMap, "Select an indicative allocation."),
      objectives: text(body, "objectives", { max: 500, message: "Tell us briefly what you want to achieve." }),
      timing: mapped(body, "timing", timingMap, "Select your intended timing."),
      message: text(body, "message", { required: false, max: 3000 }),
      consentPrivacyAt: now,
    };
    if (body.consentPrivacy !== true) fail("consentPrivacy", "Confirm you have read the privacy notice.");
    return { data };
  } catch (error) {
    if (error instanceof FormError) return { error: { field: error.field, message: error.message } };
    throw error;
  }
}

function getExtension(fileName) {
  const match = String(fileName || "").toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : "";
}

// Checks the first bytes of a file match what its extension claims. The browser's
// mimetype is ignored because the client controls it.
function contentMatchesExtension(buffer, extension) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  if (extension === ".pdf") return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
  if (extension === ".docx" || extension === ".xlsx") {
    return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  }
  if (extension === ".doc") return buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;
  if (extension === ".csv") {
    const sample = buffer.subarray(0, 8192);
    if (sample.includes(0)) return false;
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(sample);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// Returns { files } (with kind, extension and mimeType resolved) or { error, status }.
function checkTraderFiles(uploaded = {}) {
  const files = [];
  for (const [field, rule] of Object.entries(traderFileRules)) {
    const file = uploaded[field]?.[0];
    if (!file) return { status: 400, error: { field, message: `Attach your ${rule.label}.` } };
    const extension = getExtension(file.originalname);
    const mimeType = rule.types[extension];
    if (!mimeType || !contentMatchesExtension(file.buffer, extension)) {
      const accepted = Object.keys(rule.types).map((ext) => ext.slice(1).toUpperCase()).join(", ");
      return { status: 415, error: { field, message: `Your ${rule.label} must be a ${accepted} file.` } };
    }
    if (file.size > rule.maxBytes) {
      return { status: 413, error: { field, message: `Your ${rule.label} is larger than ${rule.maxBytes / MB} MB.` } };
    }
    files.push({ field, kind: rule.kind, extension, mimeType, file });
  }
  return { files };
}

module.exports = {
  MB,
  traderFileRules,
  parseTraderApplication,
  parseInvestorEnquiry,
  contentMatchesExtension,
  checkTraderFiles,
  getExtension,
};
