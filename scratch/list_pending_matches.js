const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: '8c969855-3d4e-4471-8d2c-1e79246de3a7',
        groupId: { not: null },
        OR: [
          { winnerId: null, homeScore: 0 }, // Prisma default 0
          { winnerId: null, homeScore: { gt: 0 } } // draws already marked with scores but winnerId is null
        ]
      },
      include: {
        homePlayer: { select: { firstName: true, lastName: true } },
        awayPlayer: { select: { firstName: true, lastName: true } },
        group: { select: { name: true } }
      }
    });

    console.log('📊 Total encontrados (bajo criterios de pendiente):', matches.length);
    matches.forEach(m => {
      console.log('---');
      console.log('Grupo:', m.group?.name);
      console.log('Home:', m.homePlayer?.firstName, m.homePlayer?.lastName, '- Score:', m.homeScore);
      console.log('Away:', m.awayPlayer?.firstName, m.awayPlayer?.lastName, '- Score:', m.awayScore);
      console.log('Winner:', m.winnerId);
      console.log('Innings:', m.homeInnings);
      console.log('ID:', m.id);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
