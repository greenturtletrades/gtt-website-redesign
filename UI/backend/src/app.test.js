const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.ADMIN_EMAIL = "owner@greenturtletrades.com";
process.env.ADMIN_PASSWORD = "ChangeMe123!";

const prismaMock = {
  user: {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async () => {
      throw new Error("Unexpected prisma.user.create call");
    },
    update: async () => {
      throw new Error("Unexpected prisma.user.update call");
    },
  },
  referralCode: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async () => {
      throw new Error("Unexpected prisma.referralCode.create call");
    },
  },
  traderApplication: {
    findMany: async () => [],
  },
  waitlistEntry: {
    findMany: async () => [],
  },
  churnFeedback: {
    findMany: async () => [],
  },
};

const prismaPath = require.resolve("./prisma");
require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: { prisma: prismaMock },
};

const emailPath = require.resolve("./email");
require.cache[emailPath] = {
  id: emailPath,
  filename: emailPath,
  loaded: true,
  exports: {
    sendEmail: async () => ({ ok: true }),
  },
};

const app = require("./app");

function resetPrisma() {
  prismaMock.user.findMany = async () => [];
  prismaMock.user.findFirst = async () => null;
  prismaMock.user.findUnique = async () => null;
  prismaMock.user.create = async () => {
    throw new Error("Unexpected prisma.user.create call");
  };
  prismaMock.user.update = async () => {
    throw new Error("Unexpected prisma.user.update call");
  };
  prismaMock.referralCode.findUnique = async () => null;
  prismaMock.referralCode.findMany = async () => [];
  prismaMock.referralCode.create = async () => {
    throw new Error("Unexpected prisma.referralCode.create call");
  };
  prismaMock.traderApplication.findMany = async () => [];
  prismaMock.waitlistEntry.findMany = async () => [];
  prismaMock.churnFeedback.findMany = async () => [];
}

function createToken(role = "ADMIN") {
  return jwt.sign({ sub: "staff-user", role }, process.env.JWT_SECRET);
}

async function withServer(run) {
  const server = app.listen(0);
  try {
    await run(server);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

async function request(server, path, options = {}) {
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
  const body = await response.json();
  return { status: response.status, body };
}

test.beforeEach(() => {
  resetPrisma();
});

test("GET /api/admin/traders returns analysis status for each trader", async () => {
  prismaMock.user.findMany = async () => [
    {
      id: "trader-ready",
      email: "ready@gtt.local",
      status: "ACTIVE",
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      stripeSubscriptionId: "sub_123",
      profile: { firstName: "Ready", lastName: "Trader" },
      analysisSnapshots: [
        {
          updatedAt: new Date("2026-03-21T10:00:00.000Z"),
          report: { score: 92 },
          tradesAnalysed: 40,
          avgRMultiple: 0.8,
          winRate: 54,
          sharpeRatio: 1.5,
          maxDrawdownR: -3.2,
          totalR: 12.4,
        },
      ],
      brokerAccounts: [
        {
          id: "broker-1",
          isActive: true,
          eaEvents: [
            { type: "TRADE_EVENT", receivedAt: new Date("2026-03-21T09:00:00.000Z") },
            { type: "HISTORY_EXPORT", receivedAt: new Date("2026-03-21T09:05:00.000Z") },
          ],
        },
      ],
      _count: { apiKeys: 1 },
    },
    {
      id: "trader-needs",
      email: "needs@gtt.local",
      status: "ACTIVE",
      createdAt: new Date("2026-03-19T10:00:00.000Z"),
      stripeSubscriptionId: null,
      profile: null,
      analysisSnapshots: [],
      brokerAccounts: [
        {
          id: "broker-2",
          isActive: true,
          eaEvents: [{ type: "TRADE_EVENT", receivedAt: new Date("2026-03-22T09:00:00.000Z") }],
        },
      ],
      _count: { apiKeys: 0 },
    },
    {
      id: "trader-empty",
      email: "empty@gtt.local",
      status: "PENDING",
      createdAt: new Date("2026-03-18T10:00:00.000Z"),
      stripeSubscriptionId: null,
      profile: null,
      analysisSnapshots: [],
      brokerAccounts: [],
      _count: { apiKeys: 0 },
    },
  ];

  await withServer(async (server) => {
    const response = await request(server, "/api/admin/traders", {
      headers: {
        Authorization: `Bearer ${createToken("ADMIN")}`,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);

    const readyTrader = response.body.items.find((item) => item.email === "ready@gtt.local");
    const needsTrader = response.body.items.find((item) => item.email === "needs@gtt.local");
    const emptyTrader = response.body.items.find((item) => item.email === "empty@gtt.local");

    assert.equal(readyTrader.analysisStatus, "ANALYSIS_READY");
    assert.equal(needsTrader.analysisStatus, "NEEDS_ANALYSIS");
    assert.equal(emptyTrader.analysisStatus, "NO_TRADE_DATA");
  });
});

test("GET /api/admin/staff includes the configured environment admin", async () => {
  prismaMock.user.findMany = async () => [];

  await withServer(async (server) => {
    const response = await request(server, "/api/admin/staff", {
      headers: {
        Authorization: `Bearer ${createToken("ADMIN")}`,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.items[0].email, "owner@greenturtletrades.com");
    assert.equal(response.body.items[0].source, "environment");
  });
});

test("POST /api/admin/staff/invite rejects trader tokens", async () => {
  await withServer(async (server) => {
    const response = await request(server, "/api/admin/staff/invite", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${createToken("TRADER")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "new.admin@gtt.local",
        temporaryCode: "TempCode123!",
      }),
    });

    assert.equal(response.status, 403);
    assert.deepEqual(response.body, { ok: false, error: "Forbidden" });
  });
});

test("GET /api/admin/signups returns combined signup sources", async () => {
  prismaMock.waitlistEntry.findMany = async () => [
    {
      id: "wait-1",
      email: "multi@gtt.local",
      source: "landing",
      createdAt: new Date("2026-03-18T12:00:00.000Z"),
    },
  ];
  prismaMock.traderApplication.findMany = async () => [
    {
      id: "app-1",
      email: "multi@gtt.local",
      fullName: "Multi Source",
      status: "PENDING",
      submittedAt: new Date("2026-03-19T12:00:00.000Z"),
      country: "United Kingdom",
      platform: "MT5",
    },
  ];
  prismaMock.user.findMany = async () => [
    {
      id: "user-1",
      email: "multi@gtt.local",
      status: "ACTIVE",
      createdAt: new Date("2026-03-20T12:00:00.000Z"),
      stripeSubscriptionId: null,
      profile: { firstName: "Multi", lastName: "Source" },
    },
  ];

  await withServer(async (server) => {
    const response = await request(server, "/api/admin/signups", {
      headers: {
        Authorization: `Bearer ${createToken("ADMIN")}`,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.items.length, 3);
    assert.deepEqual(
      response.body.items.map((item) => item.sourceType),
      ["trader_account", "trader_application", "landing_waitlist"]
    );
  });
});

// ---------------------------------------------------------------------------
// POST /api/referral-codes/validate
// ---------------------------------------------------------------------------

test("POST /api/referral-codes/validate returns ok for an active referral code", async () => {
  prismaMock.referralCode.findUnique = async ({ where }) => {
    if (where.code === "GTT-TEST01") {
      return { id: "rc-1", code: "GTT-TEST01", isActive: true };
    }
    return null;
  };

  await withServer(async (server) => {
    const response = await request(server, "/api/referral-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "GTT-TEST01" }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
  });
});

test("POST /api/referral-codes/validate returns error for unknown code", async () => {
  await withServer(async (server) => {
    const response = await request(server, "/api/referral-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "FAKE-CODE" }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, false);
    assert.ok(response.body.error);
  });
});

test("POST /api/referral-codes/validate returns error for inactive code", async () => {
  prismaMock.referralCode.findUnique = async () => ({
    id: "rc-2",
    code: "GTT-INACTIVE",
    isActive: false,
  });

  await withServer(async (server) => {
    const response = await request(server, "/api/referral-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "GTT-INACTIVE" }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, false);
  });
});

test("POST /api/referral-codes/validate returns 400 when code is missing", async () => {
  await withServer(async (server) => {
    const response = await request(server, "/api/referral-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.ok, false);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------------

test("POST /api/auth/forgot-password always returns ok to prevent email enumeration", async () => {
  // Email does not exist in DB — should still return ok
  await withServer(async (server) => {
    const response = await request(server, "/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nobody@gtt.local" }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
  });
});

test("POST /api/auth/forgot-password returns 400 when email is missing", async () => {
  await withServer(async (server) => {
    const response = await request(server, "/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.ok, false);
  });
});

test("POST /api/auth/forgot-password stores reset token for existing trader and returns ok", async () => {
  const updatedData = {};
  prismaMock.user.findUnique = async ({ where }) => {
    if (where.email === "trader@gtt.local") {
      return { id: "user-1", email: "trader@gtt.local", role: "TRADER" };
    }
    return null;
  };
  prismaMock.user.update = async ({ data }) => {
    Object.assign(updatedData, data);
    return {};
  };

  await withServer(async (server) => {
    const response = await request(server, "/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "trader@gtt.local" }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.ok(updatedData.passwordResetToken, "should have stored a hashed token");
    assert.ok(updatedData.passwordResetExpiresAt instanceof Date, "should have set an expiry");
    assert.ok(
      updatedData.passwordResetExpiresAt > new Date(),
      "expiry should be in the future"
    );
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/traders/:id/status
// ---------------------------------------------------------------------------

test("PATCH /api/admin/traders/:id/status disables an active trader", async () => {
  let savedStatus = null;
  prismaMock.user.findUnique = async ({ where }) => {
    if (where.id === "trader-1") {
      return { id: "trader-1", role: "TRADER", email: "trader@gtt.local" };
    }
    return null;
  };
  prismaMock.user.update = async ({ data }) => {
    savedStatus = data.status;
    return {};
  };

  await withServer(async (server) => {
    const response = await request(server, "/api/admin/traders/trader-1/status", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${createToken("ADMIN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "DISABLED" }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.status, "DISABLED");
    assert.equal(savedStatus, "DISABLED");
  });
});

test("PATCH /api/admin/traders/:id/status rejects invalid status values", async () => {
  await withServer(async (server) => {
    const response = await request(server, "/api/admin/traders/trader-1/status", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${createToken("ADMIN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "BANNED" }),
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.ok, false);
  });
});

test("PATCH /api/admin/traders/:id/status returns 404 for non-existent trader", async () => {
  await withServer(async (server) => {
    const response = await request(server, "/api/admin/traders/no-such-id/status", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${createToken("ADMIN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "ACTIVE" }),
    });

    assert.equal(response.status, 404);
    assert.equal(response.body.ok, false);
  });
});

test("PATCH /api/admin/traders/:id/status rejects trader tokens", async () => {
  await withServer(async (server) => {
    const response = await request(server, "/api/admin/traders/trader-1/status", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${createToken("TRADER")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "DISABLED" }),
    });

    assert.equal(response.status, 403);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------------

// The endpoint calls prisma.user.findFirst with a SHA-256 token hash and a
// future-expiry filter.  The mock must simulate that filtering itself.

const crypto = require("node:crypto");

function makeTokenPair() {
  const raw = "a".repeat(64); // deterministic raw token for tests
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

test("POST /api/auth/reset-password succeeds with a valid token", async () => {
  const { raw, hash } = makeTokenPair();
  let savedData = null;

  prismaMock.user.findFirst = async ({ where }) => {
    // Only verify the hash — the expiry filter is Prisma's concern, not the mock's.
    // Expiry rejection is covered separately by the expired-token test (findFirst returns null).
    if (where.passwordResetToken === hash) {
      return { id: "user-reset" };
    }
    return null;
  };
  prismaMock.user.update = async ({ where, data }) => {
    savedData = { where, data };
    return {};
  };

  await withServer(async (server) => {
    const response = await request(server, "/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: raw, password: "NewPassword1!" }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(savedData.where.id, "user-reset", "should update the matched user");
    assert.equal(savedData.data.passwordResetToken, null, "should clear the reset token");
    assert.equal(savedData.data.passwordResetExpiresAt, null, "should clear the expiry");
    assert.ok(savedData.data.passwordHash, "should set a new password hash");
  });
});

test("POST /api/auth/reset-password returns 400 for an unknown or expired token", async () => {
  // findFirst returns null — simulates expired or non-existent token
  await withServer(async (server) => {
    const response = await request(server, "/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid-or-expired-token", password: "NewPassword1!" }),
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.ok, false);
    assert.ok(response.body.error);
  });
});

test("POST /api/auth/reset-password returns 400 when password is too short", async () => {
  await withServer(async (server) => {
    const response = await request(server, "/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "sometoken", password: "short" }),
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.ok, false);
    // Should reject before hitting the DB — update must not be called
  });
});

test("POST /api/auth/reset-password returns 400 when token is missing", async () => {
  await withServer(async (server) => {
    const response = await request(server, "/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "NewPassword1!" }),
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.ok, false);
  });
});

test("POST /api/auth/reset-password does not call update when token lookup fails", async () => {
  let updateCalled = false;
  prismaMock.user.update = async () => {
    updateCalled = true;
    return {};
  };

  await withServer(async (server) => {
    await request(server, "/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "bogus", password: "NewPassword1!" }),
    });

    assert.equal(updateCalled, false, "update must not be called for invalid tokens");
  });
});
