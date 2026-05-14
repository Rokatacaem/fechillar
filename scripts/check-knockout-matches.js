const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tid = '1fa8fea1-4960-4eba-bf71-49fb8539e17d';

    const matches = await prisma.match.findMany({
        where: { tournamentId: tid, groupId: null },
        select: {
            id: true, round: true,
            homeScore: true, awayScore: true, winnerId: true,
            homePlayer: { select: { firstName: true, lastName: true } },
            awayPlayer: { select: { firstName: true, lastName: true } }
        },
        orderBy: [{ round: 'asc' }, { id: 'asc' }]
    });

    const roundNames = { 0: 'BARRAGE(36)', 1: '16VOS', 2: '8VOS', 3: 'CUARTOS', 4: 'SEMIS', 5: 'FINAL' };

    let currentRound = -1;
    matches.forEach(m => {
        if (m.round !== currentRound) {
            currentRound = m.round;
            console.log(`\n=== ${roundNames[m.round] || 'Ronda '+m.round} ===`);
        }
        const home = m.homePlayer ? `${m.homePlayer.lastName} ${m.homePlayer.firstName}` : 'NULL';
        const away = m.awayPlayer ? `${m.awayPlayer.lastName} ${m.awayPlayer.firstName}` : 'NULL';
        const score = (m.homeScore !== null && m.awayScore !== null) ? `${m.homeScore}-${m.awayScore}` : 'sin resultado';
        const winner = m.winnerId ? (m.winnerId === m.homePlayer?.id ? home : away) : '?';
        console.log(`  ${home} vs ${away} | ${score} | Ganador: ${winner}`);
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
