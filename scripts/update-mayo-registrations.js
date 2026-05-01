const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Función de fuzzy matching (misma que import-historical-tournaments.js)
function fuzzyMatch(searchName, dbFirstName, dbLastName) {
  const normalize = (str) => str.toLowerCase().trim();
  const search = normalize(searchName);
  const forward = normalize(`${dbFirstName} ${dbLastName}`);
  const backward = normalize(`${dbLastName} ${dbFirstName}`);
  
  return search === forward || search === backward;
}

async function updateMayoTournamentRegistrations() {
  try {
    console.log('🚀 ACTUALIZANDO INSCRIPCIONES TORNEO MAYO 2026');
    console.log('═══════════════════════════════════════════════\n');

    // 1. Buscar torneo Mayo 2026
    console.log('🔍 Buscando torneo Mayo 2026...');
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: { contains: 'Mayo 2026' }
      },
      include: {
        registrations: true
      }
    });

    if (!tournament) {
      console.error('❌ No se encontró el torneo Mayo 2026');
      return;
    }

    console.log(`✅ Torneo encontrado: ${tournament.name}`);
    console.log(`   ID: ${tournament.id}`);
    console.log(`   Inscripciones actuales: ${tournament.registrations.length}\n`);

    // 2. Eliminar inscripciones actuales
    console.log('🗑️  Eliminando inscripciones actuales...');
    await prisma.tournamentRegistration.deleteMany({
      where: { tournamentId: tournament.id }
    });
    console.log('✅ Inscripciones eliminadas\n');

    // 3. Leer archivo JSON
    const jsonPath = path.join(__dirname, '..', 'backups', 'inscritos-mayo-2026.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.error(`❌ No se encontró el archivo: ${jsonPath}`);
      console.log('\n📝 INSTRUCCIONES:');
      console.log('   1. Descarga inscritos-mayo-2026.json');
      console.log('   2. Cópialo a: C:\\Proyectos\\Fechillar\\backups\\');
      console.log('   3. Vuelve a ejecutar este script');
      return;
    }

    const inscritosData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`📄 Archivo cargado: ${inscritosData.length} jugadores\n`);

    // 4. Buscar todos los jugadores
    const allPlayers = await prisma.playerProfile.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        clubId: true
      }
    });

    // 5. Procesar cada inscrito
    console.log('👥 Procesando inscripciones...\n');
    
    let registered = 0;
    let notFound = [];

    for (const inscrito of inscritosData) {
      // Buscar jugador con fuzzy matching
      const player = allPlayers.find(p => 
        fuzzyMatch(inscrito.name, p.firstName, p.lastName)
      );

      if (!player) {
        notFound.push(inscrito.name);
        console.log(`   ⚠️  NO ENCONTRADO: ${inscrito.name}`);
        continue;
      }

      // Crear inscripción con disponibilidad de turnos
      await prisma.tournamentRegistration.create({
        data: {
          tournamentId: tournament.id,
          playerId: player.id,
          registeredRank: registered + 1,
          turnAvailability: inscrito.turns || ['T1', 'T2', 'T3'],
          preferredTurn: (inscrito.turns && inscrito.turns.length === 1) ? inscrito.turns[0] : (inscrito.turns && inscrito.turns.length > 1 ? 'TOTAL' : 'T1')
        }
      });

      registered++;
      const turnsDisplay = inscrito.turns.join(', ');
      console.log(`   ${registered}. ✅ ${inscrito.name} - Turnos: ${turnsDisplay}`);
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('🎉 ¡PROCESO COMPLETADO!');
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ Inscritos: ${registered}/${inscritosData.length}`);
    
    if (notFound.length > 0) {
      console.log(`\n⚠️  NO ENCONTRADOS (${notFound.length}):`);
      notFound.forEach(name => console.log(`   - ${name}`));
    }

    console.log('\n📊 RESUMEN POR TURNO:');
    const t1Only = inscritosData.filter(i => i.turns.length === 1 && i.turns[0] === 'T1').length;
    const t2Only = inscritosData.filter(i => i.turns.length === 1 && i.turns[0] === 'T2').length;
    const t3Only = inscritosData.filter(i => i.turns.length === 1 && i.turns[0] === 'T3').length;
    const flexible = inscritosData.filter(i => i.turns.length > 1).length;
    
    console.log(`   Solo T1: ${t1Only} jugadores`);
    console.log(`   Solo T2: ${t2Only} jugadores`);
    console.log(`   Solo T3: ${t3Only} jugadores`);
    console.log(`   Flexibles: ${flexible} jugadores`);

    console.log('\n📋 PRÓXIMO PASO:');
    console.log('   Generar grupos en: http://localhost:3000/tournaments');
    console.log('   (El algoritmo respetará las restricciones de turno)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMayoTournamentRegistrations();
