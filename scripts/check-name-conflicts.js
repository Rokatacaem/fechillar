const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tid = '1fa8fea1-4960-4eba-bf71-49fb8539e17d';

    // Check for specific conflicting names
    const suspects = ['Naranjo', 'Gallardo', 'Rodríguez', 'Rodriguez', 'Mejias', 'Mejia', 'Zúñiga', 'Toro'];
    for (const name of suspects) {
        const found = await prisma.playerProfile.findMany({
            where: { OR: [{ lastName: { contains: name } }, { firstName: { contains: name } }] },
            select: { id: true, firstName: true, lastName: true }
        });
        if (found.length > 0) {
            console.log(`"${name}" → ${found.map(p => `${p.lastName} ${p.firstName} [${p.id}]`).join(' | ')}`);
        }
    }

    // Get group 15 members (NARANJO should be there)
    console.log('\n=== Grupos que contienen NARANJO ===');
    const naranjoMatches = await prisma.match.findMany({
        where: {
            tournamentId: tid,
            groupId: { not: null },
            OR: [
                { homePlayer: { lastName: { contains: 'Naranjo' } } },
                { awayPlayer: { lastName: { contains: 'Naranjo' } } }
            ]
        },
        include: {
            group: { select: { name: true } },
            homePlayer: { select: { firstName: true, lastName: true } },
            awayPlayer: { select: { firstName: true, lastName: true } }
        }
    });
    naranjoMatches.forEach(m => {
        console.log(`  Grupo ${m.group?.name}: ${m.homePlayer?.lastName} ${m.homePlayer?.firstName} vs ${m.awayPlayer?.lastName} ${m.awayPlayer?.firstName}`);
    });

    // Check CARVAJAL - appears in groups but not in 16VOS as direct seed per Excel
    console.log('\n=== Grupo de CARVAJAL ===');
    const carvajalMatches = await prisma.match.findMany({
        where: {
            tournamentId: tid,
            groupId: { not: null },
            OR: [
                { homePlayer: { lastName: { contains: 'Carvajal' } } },
                { awayPlayer: { lastName: { contains: 'Carvajal' } } }
            ]
        },
        include: {
            group: { select: { name: true } },
            homePlayer: { select: { firstName: true, lastName: true } },
            awayPlayer: { select: { firstName: true, lastName: true } }
        }
    });
    carvajalMatches.forEach(m => {
        console.log(`  ${m.group?.name}: ${m.homePlayer?.lastName} ${m.homePlayer?.firstName} vs ${m.awayPlayer?.lastName} ${m.awayPlayer?.firstName}`);
    });

    // What are the actual group results? (to compare with Excel groups)
    console.log('\n=== Resultados en grupos ===');
    const groupResults = await prisma.match.findMany({
        where: { tournamentId: tid, groupId: { not: null } },
        select: {
            group: { select: { name: true } },
            homePlayer: { select: { firstName: true, lastName: true } },
            awayPlayer: { select: { firstName: true, lastName: true } },
            homeScore: true, awayScore: true, winnerId: true
        },
        orderBy: [{ group: { name: 'asc' } }]
    });

    let lastGroup = '';
    groupResults.forEach(m => {
        if (m.group?.name !== lastGroup) {
            lastGroup = m.group?.name;
            console.log(`\n${lastGroup}:`);
        }
        const score = m.homeScore || m.awayScore ? `${m.homeScore}-${m.awayScore}` : 'sin resultado';
        const win = m.winnerId ? '✓' : '?';
        console.log(`  ${m.homePlayer?.lastName} vs ${m.awayPlayer?.lastName} | ${score} ${win}`);
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
