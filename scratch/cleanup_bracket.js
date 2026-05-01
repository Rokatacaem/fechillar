const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const deleted = await prisma.match.deleteMany({
      where: {
        tournamentId: '8c969855-3d4e-4471-8d2c-1e79246de3a7',
        groupId: null
      }
    });
    console.log('✅ Partidos de bracket eliminados:', deleted.count);

    const total = await prisma.match.count({
      where: {
        tournamentId: '8c969855-3d4e-4471-8d2c-1e79246de3a7'
      }
    });
    console.log('📊 Total de partidos restantes (solo grupos):', total);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
