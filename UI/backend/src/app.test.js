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
