import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(" [AUDIT] Buscando usuarios reales en la DB...");
  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, email: true, role: true, name: true }
  });

  console.log("USERS_FOUND:" + JSON.stringify(users));
}

main().finally(() => prisma.$disconnect());
