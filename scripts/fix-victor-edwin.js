const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tournamentId = '1fa8fea1-4960-4eba-bf71-49fb8539e17d';
  
  console.log('--- Buscando a Victor Saavedra ---');
  const victor = await prisma.tournamentRegistration.findFirst({
    where: {
      tournamentId,
      player: {
        OR: [
          { firstName: { contains: 'Victor', mode: 'insensitive' } },
          { lastName: { contains: 'Saavedra', mode: 'insensitive' } }
        ]
      }
    },
    include: { player: true }
  });

  if (victor) {
    console.log(`Encontrado Victor: ${victor.player.firstName} ${victor.player.lastName} (ID Reg: ${victor.id}, ID Player: ${victor.playerId})`);
    
    // Eliminar partidos asociados (sin resultados)
    const deletedMatches = await prisma.match.deleteMany({
      where: {
        tournamentId,
        OR: [
          { homePlayerId: victor.playerId },
          { awayPlayerId: victor.playerId }
        ],
        homeScore: null
      }
    });
    console.log(`Partidos eliminados: ${deletedMatches.count}`);

    // Eliminar inscripción
    await prisma.tournamentRegistration.delete({
      where: { id: victor.id }
    });
    console.log('Inscripción eliminada correctamente.');
  } else {
    console.log('No se encontró a Victor Saavedra en las inscripciones.');
  }

  console.log('--- Buscando a Edwin Castillo ---');
  const edwin = await prisma.playerProfile.findFirst({
    where: {
      OR: [
        { firstName: { contains: 'Edwin', mode: 'insensitive' } },
        { lastName: { contains: 'Castillo', mode: 'insensitive' } }
      ]
    }
  });

  if (edwin) {
    console.log(`Encontrado Edwin: ${edwin.firstName} ${edwin.lastName} (ID: ${edwin.id})`);
    
    const edwinReg = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId: edwin.id
        }
      }
    });

    if (edwinReg) {
      console.log(`Edwin ya está inscrito (ID Reg: ${edwinReg.id}, IsWaitingList: ${edwinReg.isWaitingList})`);
    } else {
      console.log('Edwin NO está inscrito. Procediendo a inscribirlo...');
      await prisma.tournamentRegistration.create({
        data: {
          tournamentId,
          playerId: edwin.id,
          status: 'APPROVED',
          registeredPoints: 0
        }
      });
      console.log('Edwin inscrito correctamente.');
    }
  } else {
    console.log('No se encontró el perfil de Edwin Castillo.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
