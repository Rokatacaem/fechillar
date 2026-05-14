const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();
const TID = '1fa8fea1-4960-4eba-bf71-49fb8539e17d';

async function run() {
    const rounds = { 0: 'Barrage', 1: '16VOS', 2: '8VOS', 3: 'Cuartos', 4: 'Semis', 5: 'Final' };
    const matches = await prisma.match.findMany({
        where: { tournamentId: TID, groupId: null },
        select: {
            round: true, matchOrder: true, homeScore: true, awayScore: true, isWO: true,
            homePlayer: { select: { id: true, lastName: true, firstName: true } },
            awayPlayer: { select: { id: true, lastName: true, firstName: true } },
            winner:     { select: { id: true, lastName: true, firstName: true } }
        },
        orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }]
    });

    let r = -1;
    matches.forEach(m => {
        if (m.round !== r) { r = m.round; console.log(`\n=== ${rounds[r]} ===`); }
        const home = m.homePlayer ? `${m.homePlayer.lastName} ${m.homePlayer.firstName}` : 'NULL';
        const away = m.awayPlayer ? `${m.awayPlayer.lastName} ${m.awayPlayer.firstName}` : 'NULL';
        const win  = m.winner     ? `${m.winner.lastName} ${m.winner.firstName}` : '???';
        const wo   = m.isWO ? ' [WO]' : '';
        console.log(`  ${home} ${m.homeScore}-${m.awayScore} ${away}  →  Ganador: ${win}${wo}`);
    });
}

run()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
