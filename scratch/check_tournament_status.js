const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tournaments = await prisma.tournament.findMany({
    where: {
      title: {
        contains: 'Santiago Mayo 2026'
      }
    },
    include: {
      phases: {
        include: {
          groups: {
            include: {
              matches: true,
              registrations: true
            }
          }
        }
      },
      registrations: true
    }
  });

  console.log(JSON.stringify(tournaments, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
