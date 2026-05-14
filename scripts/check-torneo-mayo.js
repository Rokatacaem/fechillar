const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find the tournament
    const torneos = await prisma.tournament.findMany({
        where: { name: { contains: 'Mayo' } },
        select: { id: true, name: true, status: true, config: true }
    });
    console.log('=== TORNEOS ===');
    torneos.forEach(t => {
        const cfg = t.config;
        console.log(`ID: ${t.id}`);
        console.log(`Nombre: ${t.name}`);
        console.log(`Estado: ${t.status}`);
        console.log(`Config: ${JSON.stringify(cfg, null, 2)}`);
        console.log('---');
    });

    if (torneos.length === 0) {
        console.log('No se encontró torneo Mayo');
        return;
    }

    const tid = torneos[0].id;

    // Count enrollments
    const enrollments = await prisma.tournamentEnrollment.count({ where: { tournamentId: tid } });
    console.log(`\nInscripciones: ${enrollments}`);

    // Count groups
    const groups = await prisma.tournamentGroup.findMany({
        where: { tournamentId: tid },
        select: { id: true, name: true, order: true },
        orderBy: { order: 'asc' }
    });
    console.log(`\nGrupos (${groups.length}):`);
    groups.forEach(g => console.log(`  ${g.order}. ${g.name} (${g.id})`));

    // Count matches by phase
    const allMatches = await prisma.match.findMany({
        where: { tournamentId: tid },
        select: { round: true, groupId: true, homePlayerId: true, awayPlayerId: true, winnerId: true, homeScore: true, awayScore: true }
    });

    const groupMatches = allMatches.filter(m => m.groupId !== null);
    const knockoutMatches = allMatches.filter(m => m.groupId === null);

    console.log(`\nPartidos totales: ${allMatches.length}`);
    console.log(`  Fase grupos: ${groupMatches.length}`);
    console.log(`  Fase eliminatoria: ${knockoutMatches.length}`);

    if (knockoutMatches.length > 0) {
        console.log('\nPartidos eliminatoria por ronda:');
        const byRound = {};
        knockoutMatches.forEach(m => {
            byRound[m.round] = (byRound[m.round] || 0) + 1;
        });
        Object.keys(byRound).sort((a,b) => a-b).forEach(r => {
            console.log(`  Ronda ${r}: ${byRound[r]} partidos`);
        });
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
