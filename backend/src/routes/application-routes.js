const crypto = require("crypto");
const multer = require("multer");
const {
  MB,
  parseTraderApplication,
  parseInvestorEnquiry,
  checkTraderFiles,
} = require("../services/application-forms");
const { escapeHtml } = require("../services/html");

// Labels for emails and the admin dashboard.
const recordTypeLabels = { LIVE: "Live", DEMO: "Demo", COMPETITION: "Competition" };
const allocationLabels = {
  UNDER_50K: "Under £50k",
  FROM_50K_TO_250K: "£50k–£250k",
  FROM_250K_TO_1M: "£250k–£1m",
  OVER_1M: "Over £1m",
};
const timingLabels = {
  WITHIN_3_MONTHS: "Within 3 months",
  FROM_3_TO_12_MONTHS: "3–12 months",
  EXPLORING: "Exploring",
};
const professionalStatusLabels = { YES: "Yes", NO: "No", NOT_SURE: "Not sure" };
const investorEnquiryStatuses = new Set(["NEW", "CONTACTED", "CLOSED"]);

function toNumberOrNull(value) {
  return value === null || value === undefined ? null : Number(value);
}

function emailLayout(bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 640px; margin: 0 auto;">
      <div style="padding: 24px 0 12px;">
        <h2 style="margin: 0; color: #0f766e;">Green Turtle Trades</h2>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
        ${bodyHtml}
      </div>
    </div>
  `;
}

function detailRows(rows) {
  const html = rows
    .map(([label, value]) => `<p style="margin: 0 0 8px;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value ?? "Not provided")}</p>`)
    .join("");
  const text = rows.map(([label, value]) => `${label}: ${value ?? "Not provided"}`).join("\n");
  return {
    html: `<div style="margin: 20px 0; padding: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">${html}</div>`,
    text,
  };
}

function registerApplicationRoutes(app, {
  prisma,
  sendEmail,
  env,
  rateLimit,
  getClientIp,
  fileStorage,
  authRequired,
  adminRequired,
  staffWriteRequired,
}) {
  const formRateLimitMax = Number(env.FORM_RATE_LIMIT_MAX) || 5;
  const appUrl = (env.APP_URL || env.FRONTEND_URL || "https://greenturtletraders.co.uk").replace(/\/+$/, "");

  const traderUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * MB, files: 3, fields: 60, fieldSize: 32 * 1024 },
  }).fields([
    { name: "cv", maxCount: 1 },
    { name: "brokerStatement", maxCount: 1 },
    { name: "tradeHistory", maxCount: 1 },
  ]);

  function requireApplicationsOpen(req, res, next) {
    if (env.TRADER_APPLICATIONS_OPEN !== "true") {
      return res.status(403).json({ ok: false, error: "Trader applications are currently closed." });
    }
    if (!fileStorage.isFileStorageConfigured()) {
      console.error("Trader applications are open but file storage is not configured.");
      return res.status(503).json({ ok: false, error: "Applications can't be accepted right now. Please try again later." });
    }
    return next();
  }

  function parseTraderUpload(req, res, next) {
    traderUpload(req, res, (err) => {
      if (!err) return next();
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ ok: false, field: err.field, error: "A file is larger than 20 MB." });
      }
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ ok: false, error: "The upload could not be read. Please try again." });
      }
      return next(err);
    });
  }

  app.post(
    "/api/trader/apply",
    requireApplicationsOpen,
    rateLimit({
      windowMs: 60 * 60 * 1000,
      max: formRateLimitMax,
      keyPrefix: "trader-apply",
      message: "Too many applications from this connection. Please try again later.",
    }),
    parseTraderUpload,
    async (req, res, next) => {
      const uploadedKeys = [];
      try {
        const parsed = parseTraderApplication(req.body || {});
        if (parsed.error) {
          return res.status(400).json({ ok: false, field: parsed.error.field, error: parsed.error.message });
        }

        const checked = checkTraderFiles(req.files || {});
        if (checked.error) {
          return res.status(checked.status).json({ ok: false, field: checked.error.field, error: checked.error.message });
        }

        // Upload first so a database row never points at a missing file.
        for (const item of checked.files) {
          item.storageKey = fileStorage.buildStorageKey("trader-applications", item.extension);
          await fileStorage.putPrivateObject({ key: item.storageKey, body: item.file.buffer, contentType: item.mimeType });
          uploadedKeys.push(item.storageKey);
        }

        const statusLookupToken = crypto.randomBytes(24).toString("hex");
        const application = await prisma.traderApplication.create({
          data: {
            ...parsed.data,
            statusLookupToken,
            submittedIp: getClientIp(req),
            files: {
              create: checked.files.map((item) => ({
                kind: item.kind,
                storageKey: item.storageKey,
                fileName: String(item.file.originalname).slice(0, 200),
                size: item.file.size,
                mimeType: item.mimeType,
              })),
            },
          },
        });

        sendTraderApplicationEmails(application).catch((error) =>
          console.error("Trader application emails failed:", error?.message || error)
        );

        return res.json({ ok: true, id: application.id, status: application.status, statusLookupToken });
      } catch (err) {
        await Promise.allSettled(uploadedKeys.map((key) => fileStorage.deleteObject(key)));
        return next(err);
      }
    }
  );

  async function sendTraderApplicationEmails(application) {
    const recordLabel = recordTypeLabels[application.recordType] || "Unknown";
    const summary = detailRows([
      ["Name", application.fullName],
      ["Email", application.email],
      ["Country", application.country],
      ["Broker", application.brokerName],
      ["Platform", application.platform === "OTHER" ? `Other (${application.platformOther})` : application.platform],
      ["Record type", recordLabel],
      ["Historical return", `${toNumberOrNull(application.returnPct)}%`],
      ["Maximum drawdown", `${toNumberOrNull(application.maxDrawdownPct)}%`],
    ]);

    const applicantMessage = [
      "Thanks, we've received your application.",
      "We will review your CV and records, verify your trading history and contact you within 10 working days if we'd like to discuss your strategy.",
      "Applying does not guarantee selection, a contract or investor capital.",
    ];

    await Promise.allSettled([
      sendEmail({
        to: application.email,
        replyTo: env.APPLICATIONS_NOTIFY_TO || env.EMAIL_NOTIFY_TO || env.EMAIL_FROM,
        subject: "We've received your application",
        html: emailLayout(`
          <p style="margin-top: 0;">Hi ${escapeHtml(application.fullName)},</p>
          ${applicantMessage.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
          <p style="font-size: 13px; color: #64748b;">Application reference: ${escapeHtml(application.statusLookupToken)}</p>
          <p style="margin-bottom: 0;">Best regards,<br />Green Turtle Trades</p>
        `),
        text: [
          `Hi ${application.fullName},`,
          "",
          ...applicantMessage,
          "",
          `Application reference: ${application.statusLookupToken}`,
          "",
          "Best regards,",
          "Green Turtle Trades",
        ].join("\n"),
      }),
      (async () => {
        const notifyTo = env.APPLICATIONS_NOTIFY_TO || env.EMAIL_NOTIFY_TO;
        if (!notifyTo) return;
        // Demo and competition records are flagged in the subject so they are reviewed separately.
        const flag = application.recordType === "LIVE" ? "" : ` [${recordLabel.toUpperCase()} RECORD]`;
        await sendEmail({
          to: notifyTo,
          replyTo: application.email,
          subject: `New trader application: ${application.fullName}${flag}`,
          html: emailLayout(`
            <p style="margin-top: 0;">A new trader application has been submitted.</p>
            ${summary.html}
            <p>Files are stored privately. Open the application in the <a href="${escapeHtml(`${appUrl}/admin`)}">admin dashboard</a> to review and download them.</p>
          `),
          text: [
            "A new trader application has been submitted.",
            "",
            summary.text,
            "",
            `Review it in the admin dashboard: ${appUrl}/admin`,
          ].join("\n"),
        });
      })(),
    ]);
  }

  app.post(
    "/api/investor/enquiry",
    rateLimit({
      windowMs: 60 * 60 * 1000,
      max: formRateLimitMax,
      keyPrefix: "investor-enquiry",
      message: "Too many enquiries from this connection. Please try again later.",
    }),
    async (req, res, next) => {
      try {
        if (env.INVESTOR_ENQUIRIES_OPEN === "false") {
          return res.status(403).json({ ok: false, error: "Investor enquiries are currently closed." });
        }

        const parsed = parseInvestorEnquiry(req.body || {});
        if (parsed.error) {
          return res.status(400).json({ ok: false, field: parsed.error.field, error: parsed.error.message });
        }

        const enquiry = await prisma.investorEnquiry.create({
          data: { ...parsed.data, submittedIp: getClientIp(req) },
        });

        sendInvestorEnquiryEmails(enquiry).catch((error) =>
          console.error("Investor enquiry emails failed:", error?.message || error)
        );

        return res.json({ ok: true, id: enquiry.id });
      } catch (err) {
        return next(err);
      }
    }
  );

  async function sendInvestorEnquiryEmails(enquiry) {
    const enquirerMessage = [
      "Thank you for your enquiry. A member of the GTT team will contact you to discuss the service and next steps.",
      "Access depends on assessment and client categorisation by the regulated firm. This enquiry does not establish eligibility.",
    ];
    const summary = detailRows([
      ["Name", enquiry.fullName],
      ["Email", enquiry.email],
      ["Telephone", enquiry.phone],
      ["Enquiring as", enquiry.enquiringAs === "ORGANISATION" ? "Organisation" : "Individual"],
      ...(enquiry.enquiringAs === "ORGANISATION" ? [["Organisation", enquiry.organisation], ["Role", enquiry.role]] : []),
      [enquiry.enquiringAs === "ORGANISATION" ? "Country of incorporation" : "Country of residence", enquiry.country],
      ["Says already professional client", professionalStatusLabels[enquiry.professionalStatus]],
      ["Indicative allocation", allocationLabels[enquiry.allocationRange]],
      ["Objectives", enquiry.objectives],
      ["Timing", timingLabels[enquiry.timing]],
      ["Message", enquiry.message],
    ]);

    await Promise.allSettled([
      sendEmail({
        to: enquiry.email,
        replyTo: env.ENQUIRIES_NOTIFY_TO || env.EMAIL_NOTIFY_TO || env.EMAIL_FROM,
        subject: "Thank you for your enquiry",
        html: emailLayout(`
          <p style="margin-top: 0;">Hi ${escapeHtml(enquiry.fullName)},</p>
          ${enquirerMessage.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
          <p style="margin-bottom: 0;">Best regards,<br />Green Turtle Trades</p>
        `),
        text: [`Hi ${enquiry.fullName},`, "", ...enquirerMessage, "", "Best regards,", "Green Turtle Trades"].join("\n"),
      }),
      (async () => {
        const notifyTo = env.ENQUIRIES_NOTIFY_TO || env.EMAIL_NOTIFY_TO;
        if (!notifyTo) return;
        await sendEmail({
          to: notifyTo,
          replyTo: enquiry.email,
          subject: `New investor enquiry: ${enquiry.fullName} (${allocationLabels[enquiry.allocationRange]})`,
          html: emailLayout(`<p style="margin-top: 0;">A new investor enquiry has been submitted.</p>${summary.html}`),
          text: ["A new investor enquiry has been submitted.", "", summary.text].join("\n"),
        });
      })(),
    ]);
  }

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  function serializeApplication(application) {
    return {
      ...application,
      yearsExperience: toNumberOrNull(application.yearsExperience),
      returnPct: toNumberOrNull(application.returnPct),
      maxDrawdownPct: toNumberOrNull(application.maxDrawdownPct),
      historyStartDate: application.historyStartDate ? application.historyStartDate.toISOString().slice(0, 10) : null,
      files: (application.files || []).map((file) => ({
        id: file.id,
        kind: file.kind,
        fileName: file.fileName,
        size: file.size,
        mimeType: file.mimeType,
        createdAt: file.createdAt,
      })),
    };
  }

  app.get("/api/admin/trader-applications/:id", authRequired, adminRequired, async (req, res, next) => {
    try {
      const application = await prisma.traderApplication.findUnique({
        where: { id: req.params.id },
        include: { files: { orderBy: { createdAt: "asc" } } },
      });
      if (!application) {
        return res.status(404).json({ ok: false, error: "Application not found" });
      }
      const { statusLookupToken, submittedIp, ...visible } = application;
      return res.json({ ok: true, application: serializeApplication(visible) });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/admin/trader-applications/:id/files/:fileId", authRequired, adminRequired, async (req, res, next) => {
    try {
      const file = await prisma.traderApplicationFile.findUnique({ where: { id: req.params.fileId } });
      if (!file || file.applicationId !== req.params.id) {
        return res.status(404).json({ ok: false, error: "File not found" });
      }
      const expiresInSeconds = 300;
      const url = await fileStorage.getDownloadUrl(file.storageKey, file.fileName, expiresInSeconds);
      console.info(`[audit] admin ${req.user.id} downloaded application file ${file.id} (application ${file.applicationId})`);
      return res.json({ ok: true, url, expiresInSeconds });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/admin/investor-enquiries", authRequired, adminRequired, async (req, res, next) => {
    try {
      const { status } = req.query;
      if (status && (typeof status !== "string" || !investorEnquiryStatuses.has(status))) {
        return res.status(400).json({ ok: false, error: "Invalid status" });
      }
      const items = await prisma.investorEnquiry.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
        take: 500,
      });
      return res.json({ ok: true, items: items.map(({ submittedIp, ...item }) => item) });
    } catch (err) {
      return next(err);
    }
  });

  app.patch("/api/admin/investor-enquiries/:id", authRequired, staffWriteRequired, async (req, res, next) => {
    try {
      const { status, internalNote } = req.body || {};
      const data = {};
      if (status !== undefined) {
        if (typeof status !== "string" || !investorEnquiryStatuses.has(status)) {
          return res.status(400).json({ ok: false, error: "Invalid status" });
        }
        data.status = status;
      }
      if (internalNote !== undefined) {
        if (internalNote !== null && (typeof internalNote !== "string" || internalNote.length > 5000)) {
          return res.status(400).json({ ok: false, error: "Internal note must be text under 5000 characters" });
        }
        data.internalNote = internalNote && internalNote.trim() ? internalNote.trim() : null;
      }
      if (!Object.keys(data).length) {
        return res.status(400).json({ ok: false, error: "Nothing to update" });
      }
      const existing = await prisma.investorEnquiry.findUnique({ where: { id: req.params.id }, select: { id: true } });
      if (!existing) {
        return res.status(404).json({ ok: false, error: "Enquiry not found" });
      }
      const updated = await prisma.investorEnquiry.update({ where: { id: req.params.id }, data });
      const { submittedIp, ...item } = updated;
      return res.json({ ok: true, item });
    } catch (err) {
      return next(err);
    }
  });
}

module.exports = {
  registerApplicationRoutes,
};
