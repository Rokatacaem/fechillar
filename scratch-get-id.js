const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const t = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log(t.id);
}

main().finally(() => prisma.$disconnect());
