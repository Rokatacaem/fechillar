const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tid = '1fa8fea1-4960-4eba-bf71-49fb8539e17d';

    // Get players from group matches
    const groupMatches = await prisma.match.findMany({
        where: { tournamentId: tid, groupId: { not: null } },
        select: {
            groupId: true,
            homePlayer: { select: { id: true, firstName: true, lastName: true } },
            awayPlayer: { select: { id: true, firstName: true, lastName: true } }
        }
    });

    const playerMap = new Map();
    groupMatches.forEach(m => {
        if (m.homePlayer) playerMap.set(m.homePlayer.id, `${m.homePlayer.lastName} ${m.homePlayer.firstName}`);
        if (m.awayPlayer) playerMap.set(m.awayPlayer.id, `${m.awayPlayer.lastName} ${m.awayPlayer.firstName}`);
    });

    const players = Array.from(playerMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`\nJugadores en fase grupos (${players.length}):`);
    players.forEach(p => console.log(`  "${p.name}" [${p.id}]`));

    // Also check which players appear in knockout matches
    const knockoutMatches = await prisma.match.findMany({
        where: { tournamentId: tid, groupId: null },
        select: {
            round: true,
            homePlayer: { select: { id: true, firstName: true, lastName: true } },
            awayPlayer: { select: { id: true, firstName: true, lastName: true } }
        }
    });

    const knockoutPlayerMap = new Map();
    knockoutMatches.forEach(m => {
        if (m.homePlayer) knockoutPlayerMap.set(m.homePlayer.id, `${m.homePlayer.lastName} ${m.homePlayer.firstName}`);
        if (m.awayPlayer) knockoutPlayerMap.set(m.awayPlayer.id, `${m.awayPlayer.lastName} ${m.awayPlayer.firstName}`);
    });

    console.log(`\nJugadores en fase eliminatoria (${knockoutPlayerMap.size}):`);
    Array.from(knockoutPlayerMap.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .forEach(([id, name]) => console.log(`  "${name}" [${id}]`));

    // Find players in groups but NOT in knockout
    const groupOnly = players.filter(p => !knockoutPlayerMap.has(p.id));
    console.log(`\nJugadores en grupos pero NO en eliminatoria (${groupOnly.length}):`);
    groupOnly.forEach(p => console.log(`  ${p.name}`));
}

main()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
