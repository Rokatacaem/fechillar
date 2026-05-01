const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SOURCE_TOURNAMENT_ID = '1fa8fea1-4960-4eba-bf71-49fb8539e17d';
const NEW_TOURNAMENT_NAME = 'SIMULACRO_NACIONAL_MAYO_RODRIGO';

async function cloneTournament() {
  console.log(`🚀 Iniciando clonación del torneo: ${SOURCE_TOURNAMENT_ID}`);

  try {
    // 1. Obtener torneo original
    const sourceTournament = await prisma.tournament.findUnique({
      where: { id: SOURCE_TOURNAMENT_ID },
      include: {
        registrations: true,
        groups: {
          include: {
            matches: true
          }
        }
      }
    });

    if (!sourceTournament) {
      throw new Error('Torneo origen no encontrado');
    }

    console.log(`✅ Torneo origen encontrado: ${sourceTournament.name}`);

    // 2. Crear nuevo torneo (Clon)
    const { id, createdAt, updatedAt, ...tournamentData } = sourceTournament;
    const newTournament = await prisma.tournament.create({
      data: {
        ...tournamentData,
        name: NEW_TOURNAMENT_NAME,
        status: 'IN_PROGRESS', // Lo ponemos en progreso para pruebas
        registrations: undefined,
        groups: undefined,
        matches: undefined,
        phases: undefined,
        assignments: undefined,
        enrollments: undefined,
        photos: undefined,
        waitingList: undefined
      }
    });

    console.log(`✅ Nuevo torneo creado con ID: ${newTournament.id}`);

    // 3. Clonar Grupos y sus Partidos
    console.log('📦 Clonando grupos y partidos...');
    
    // Mapeo de IDs antiguos a nuevos para las inscripciones
    const groupMapping = {};

    for (const group of sourceTournament.groups) {
      const { id: oldGroupId, tournamentId: oldTId, createdAt: gca, updatedAt: gua, matches, ...groupData } = group;
      
      const newGroup = await prisma.tournamentGroup.create({
        data: {
          ...groupData,
          tournamentId: newTournament.id
        }
      });

      groupMapping[oldGroupId] = newGroup.id;

      // Clonar partidos del grupo
      if (matches && matches.length > 0) {
        const matchesData = matches.map(m => {
          const { id: oldMId, tournamentId: oldMTId, groupId: oldMGId, createdAt: mca, ...matchData } = m;
          return {
            ...matchData,
            tournamentId: newTournament.id,
            groupId: newGroup.id
          };
        });

        await prisma.match.createMany({
          data: matchesData
        });
      }
    }

    console.log(`✅ ${sourceTournament.groups.length} grupos clonados.`);

    // 4. Clonar Inscripciones
    console.log('👥 Clonando inscripciones (54 jugadores)...');
    
    const registrationsData = sourceTournament.registrations.map(r => {
      const { id: oldRId, tournamentId: oldRTId, groupId: oldRGId, createdAt: rca, ...regData } = r;
      return {
        ...regData,
        tournamentId: newTournament.id,
        groupId: oldRGId ? groupMapping[oldRGId] : null,
        status: 'APPROVED', // Aseguramos que estén aprobados
        paymentStatus: 'PAID' // Y pagados
      };
    });

    await prisma.tournamentRegistration.createMany({
      data: registrationsData
    });

    console.log(`✅ ${registrationsData.length} inscripciones clonadas.`);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 CLONACIÓN COMPLETADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Nuevo Torneo: ${NEW_TOURNAMENT_NAME}`);
    console.log(`ID: ${newTournament.id}`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error durante la clonación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cloneTournament();
