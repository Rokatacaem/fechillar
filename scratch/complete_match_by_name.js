const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeMatch() {
  try {
    // Buscar los perfiles de jugadores (en el esquema es PlayerProfile, no Player)
    const players = await prisma.playerProfile.findMany({
      where: {
        OR: [
          { firstName: 'Fernando', lastName: { contains: 'Ramirez' } },
          { firstName: 'Rogelio', lastName: { contains: 'Orozco' } }
        ]
      }
    });
    
    console.log('Jugadores encontrados:', players.map(p => p.firstName + ' ' + p.lastName));
    
    if (players.length < 2) {
      console.log('❌ No se encontraron ambos jugadores. Verifica los nombres.');
      return;
    }
    
    const fernando = players.find(p => p.firstName === 'Fernando');
    const rogelio = players.find(p => p.firstName === 'Rogelio');
    
    // Buscar el partido entre ellos
    const match = await prisma.match.findFirst({
      where: {
        tournamentId: '8c969855-3d4e-4471-8d2c-1e79246de3a7',
        OR: [
          { homePlayerId: fernando.id, awayPlayerId: rogelio.id },
          { homePlayerId: rogelio.id, awayPlayerId: fernando.id }
        ]
      }
    });
    
    if (!match) {
      console.log('❌ No se encontró el partido entre ellos en este torneo.');
      return;
    }
    
    console.log('📋 Partido encontrado ID:', match.id);
    
    // Actualizar como empate
    await prisma.match.update({
      where: { id: match.id },
      data: {
        homeScore: 11,
        awayScore: 11,
        homeInnings: 35,
        awayInnings: 35,
        homeHighRun: match.homePlayerId === fernando.id ? 2 : 4,
        awayHighRun: match.homePlayerId === fernando.id ? 4 : 2,
        winnerId: null
      }
    });
    
    console.log('✅ Partido marcado como EMPATE correctamente');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeMatch();
