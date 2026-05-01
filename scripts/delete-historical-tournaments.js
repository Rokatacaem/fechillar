const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteHistoricalTournaments() {
  try {
    console.log('🗑️ LIMPIEZA DE TORNEOS HISTÓRICOS MAL IMPORTADOS');
    console.log('═══════════════════════════════════════════════════');
    
    // Buscar torneos históricos
    const historicalTournaments = await prisma.tournament.findMany({
      where: {
        name: {
          in: ['Open La Calera 2026', 'Open San Miguel 2026']
        }
      },
      include: {
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    if (historicalTournaments.length === 0) {
      console.log('✅ No hay torneos históricos para eliminar');
      return;
    }

    console.log(`\n📋 Torneos encontrados (${historicalTournaments.length}):`);
    for (const tournament of historicalTournaments) {
      console.log(`   • ${tournament.name}`);
      console.log(`     ID: ${tournament.id}`);
      console.log(`     Inscripciones: ${tournament._count.registrations}`);
      console.log(`     Estado: ${tournament.status}`);
    }

    console.log('\n🗑️ Eliminando torneos y sus inscripciones...');
    
    // Eliminar torneos (cascade eliminará las inscripciones automáticamente)
    const deleted = await prisma.tournament.deleteMany({
      where: {
        name: {
          in: ['Open La Calera 2026', 'Open San Miguel 2026']
        }
      }
    });

    console.log(`\n✅ ${deleted.count} torneo(s) eliminado(s)`);
    console.log('✅ Inscripciones eliminadas automáticamente (cascade)');
    
    console.log('\n📊 NOTA IMPORTANTE:');
    console.log('   Los rankings NO se han revertido.');
    console.log('   Si los puntos fueron sumados incorrectamente,');
    console.log('   necesitarás ajustarlos manualmente o hacer un restore del backup.');
    
    console.log('\n🚀 Ahora puedes re-ejecutar la importación:');
    console.log('   node scripts/import-historical-tournaments.js');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteHistoricalTournaments();
