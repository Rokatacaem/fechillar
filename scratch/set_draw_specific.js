const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Primero encuentra el partido pendiente
    const match = await prisma.match.findFirst({
      where: {
        tournamentId: '8c969855-3d4e-4471-8d2c-1e79246de3a7',
        groupId: { not: null },
        winnerId: null,
        homeScore: 0 // El default en el esquema es 0 para partidos no jugados si se crearon con createMany sin valores
      },
      include: {
        homePlayer: { select: { firstName: true, lastName: true } },
        awayPlayer: { select: { firstName: true, lastName: true } }
      }
    });

    if (!match) {
      console.log('❌ No se encontró el partido pendiente (quizás ya tiene resultados o el score no es 0)');
      return;
    }
    
    console.log('📋 Partido encontrado:', match.homePlayer.firstName, 'vs', match.awayPlayer.firstName);
    
    // Actualizar con empate
    await prisma.match.update({
      where: { id: match.id },
      data: {
        homeScore: 11,
        awayScore: 11,
        homeInnings: 35,
        awayInnings: 35,
        homeHighRun: 2,
        awayHighRun: 4,
        winnerId: null  // EMPATE
      }
    });
    console.log('✅ Partido actualizado como EMPATE');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
