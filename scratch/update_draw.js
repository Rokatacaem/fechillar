const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.match.updateMany({
      where: {
        tournamentId: '8c969855-3d4e-4471-8d2c-1e79246de3a7',
        winnerId: null,
        groupId: { not: null }
      },
      data: {
        homeScore: 11,
        awayScore: 11,
        homeInnings: 35,
        awayInnings: 35,
        homeHighRun: 2,
        awayHighRun: 4,
        winnerId: null
      }
    });
    console.log('Partidos actualizados:', result.count);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
