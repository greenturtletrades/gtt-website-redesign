require("dotenv").config();

const { prisma } = require("../src/db/prisma");

const SIGNUP_DATE = new Date("2026-04-30T12:00:00.000Z");
const EMAILS = [
  "fulldiscovery@gmail.com",
  "kristel.norge1@outlook.com",
  "lukutisbremner@gmail.com",
  "l.e.o.sch.mdt.346@gmail.com",
  "bhadvaf@gmail.com",
];

async function main() {
  const normalizedEmails = Array.from(
    new Set(
      EMAILS.map((email) => String(email || "").trim().toLowerCase()).filter(Boolean)
    )
  );

  let inserted = 0;
  let updated = 0;

  for (const email of normalizedEmails) {
    const existing = await prisma.waitlistEntry.findUnique({
      where: { email },
      select: { id: true },
    });

    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {
        source: "investor",
        createdAt: SIGNUP_DATE,
      },
      create: {
        email,
        source: "investor",
        createdAt: SIGNUP_DATE,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        signupDate: SIGNUP_DATE.toISOString(),
        total: normalizedEmails.length,
        inserted,
        updated,
        emails: normalizedEmails,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Investor signup import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
