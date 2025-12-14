
import { prisma } from "./lib/prisma";

async function main() {
  console.log("Checking prisma properties...");
  // Check common casings
  const keys = Object.keys(prisma);
  console.log("Keys on prisma instance (filtered):", keys.filter(k => k.toLowerCase().includes('log')));
  
  console.log("prisma.xpLog:", (prisma as any).xpLog);
  console.log("prisma.XpLog:", (prisma as any).XpLog);
  console.log("prisma.xPLog:", (prisma as any).xPLog);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
