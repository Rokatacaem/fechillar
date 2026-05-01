const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTournamentStructure() {
  try {
    console.log('🎯 ACTUALIZANDO ESTRUCTURA DEL TORNEO MAYO 2026\n');

    // Buscar el torneo Mayo 2026
    const tournament = await prisma.tournament.findFirst({
      where: { name: { contains: 'Mayo 2026' } },
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
    console.log(`   Inscritos: ${tournament.registrations.length}\n`);

    // Configuración del torneo
    const totalJugadores = 54;
    const jugadoresPorGrupo = 3;
    const avanzanPorGrupo = 2;
    const cuadroDeseado = 32;

    // Cálculos
    const totalGrupos = Math.floor(totalJugadores / jugadoresPorGrupo); // 18
    const clasificados = totalGrupos * avanzanPorGrupo; // 36
    const diferencia = clasificados - cuadroDeseado; // 4

    // Calcular fase de ajuste
    const jugadoresEnPlayoff = diferencia * 2; // 8
    const directos = clasificados - jugadoresEnPlayoff; // 28
    const partidosPlayoff = jugadoresEnPlayoff / 2; // 4

    const adjustmentPhaseConfig = {
      tipo: 'PLAYOFF',
      directos: directos,
      puestosDirectos: `1-${directos}`,
      jugadoresPlayoff: jugadoresEnPlayoff,
      puestosPlayoff: `${directos + 1}-${clasificados}`,
      partidosPlayoff: partidosPlayoff,
      emparejamientos: [
        { puesto1: 29, puesto2: 36 },
        { puesto1: 30, puesto2: 35 },
        { puesto1: 31, puesto2: 34 },
        { puesto1: 32, puesto2: 33 }
      ]
    };

    // Generar texto de estructura
    const tournamentStructure = `
ESTRUCTURA DEL TORNEO

FASE DE GRUPOS (${totalJugadores} jugadores):
• ${totalGrupos} grupos de ${jugadoresPorGrupo} jugadores
• ${avanzanPorGrupo} jugadores avanzan por grupo = ${clasificados} clasificados

CLASIFICACIÓN POR RANKING:
Después de la fase de grupos, los ${clasificados} clasificados se rankean del puesto 1 al ${clasificados} según:
1. Promedio General de Partidos (PGP)
2. Carambolas a favor
3. Resultado directo

CLASIFICACIÓN DIRECTA (${directos} mejores):
• Puestos 1-${directos}: Clasifican directo a treintaidosavos de final

FASE DE AJUSTE (${jugadoresEnPlayoff} jugadores):
• Puestos ${directos + 1}-${clasificados}: Disputan ${partidosPlayoff} partidos por ${partidosPlayoff} cupos restantes
• Emparejamientos: 29vs36, 30vs35, 31vs34, 32vs33
• Los ${partidosPlayoff} ganadores avanzan a treintaidosavos de final

TREINTAIDOSAVOS DE FINAL:
• ${cuadroDeseado} jugadores: ${directos} clasificados directos + ${partidosPlayoff} ganadores de fase de ajuste
• Sistema de eliminación directa hasta la final

FASES POSTERIORES:
Dieciseisavos → Octavos → Cuartos de final → Semifinales → Final
`.trim();

    // Actualizar el torneo
    const updatedTournament = await prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        playoffBracketSize: cuadroDeseado,
        requiresAdjustment: true,
        adjustmentPhaseConfig: adjustmentPhaseConfig,
        tournamentStructure: tournamentStructure
      }
    });

    console.log('📊 CONFIGURACIÓN CALCULADA:');
    console.log(`   Total jugadores: ${totalJugadores}`);
    console.log(`   Grupos: ${totalGrupos} grupos de ${jugadoresPorGrupo}`);
    console.log(`   Clasificados: ${clasificados}`);
    console.log(`   Cuadro objetivo: ${cuadroDeseado}`);
    console.log(`   Diferencia: +${diferencia} (requiere ajuste)\n`);

    console.log('⚙️  FASE DE AJUSTE:');
    console.log(`   Directos: ${directos} jugadores (puestos 1-${directos})`);
    console.log(`   Playoff: ${jugadoresEnPlayoff} jugadores (puestos ${directos + 1}-${clasificados})`);
    console.log(`   Partidos: ${partidosPlayoff}`);
    console.log(`   Emparejamientos:`);
    adjustmentPhaseConfig.emparejamientos.forEach(e => {
      console.log(`      - Puesto ${e.puesto1} vs Puesto ${e.puesto2}`);
    });
    console.log(`   Ganadores: ${partidosPlayoff}\n`);

    console.log('🎉 ¡TORNEO ACTUALIZADO EXITOSAMENTE!');
    console.log('\n📋 BASES DEL TORNEO:\n');
    console.log(tournamentStructure);
    console.log('\n✅ El torneo está listo para generar grupos.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTournamentStructure();
