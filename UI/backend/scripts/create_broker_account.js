require("dotenv").config();

// Use the same prisma instance as the running app
const { prisma } = require("../src/prisma");

async function main() {
  const userEmail = process.env.USER_EMAIL || "seany.norge@gmail.com";
  const platform = process.env.PLATFORM || "MT5";
  const accountNumber = process.env.ACCOUNT_NUMBER || "12345678";
  const brokerName = process.env.BROKER_NAME || "DemoBroker";
  const label = process.env.LABEL || "Main";

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error(`User not found for email: ${userEmail}`);
  }

  const created = await prisma.brokerAccount.create({
    data: {
      userId: user.id,
      platform,
      accountNumber,
      brokerName,
      label,
      isActive: true,
    },
    select: {
      id: true,
      userId: true,
      platform: true,
      accountNumber: true,
      brokerName: true,
      label: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log("✅ BrokerAccount created:");
  console.log(created);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
