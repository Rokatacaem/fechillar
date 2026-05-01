import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Buscar el torneo más reciente
    const tournament = await prisma.tournament.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
            matches: {
                include: {
                    group: true,
                    homePlayer: true,
                    awayPlayer: true
                },
                where: {
                    groupId: { not: null }
                },
                orderBy: [
                    { group: { order: "asc" } },
                    { matchOrder: "asc" }
                ]
            }
        }
    });

    if (!tournament) {
        console.log("No hay torneo");
        return;
    }

    console.log(`Torneo: ${tournament.name}`);
    
    let currentGroup = "";
    tournament.matches.forEach(m => {
        if (!m.homePlayer || !m.awayPlayer) return;
        const groupName = m.group?.name || "Sin grupo";
        if (groupName !== currentGroup) {
            console.log(`\n--- GRUPO ${groupName} ---`);
            currentGroup = groupName;
        }

        const hName = `${m.homePlayer.firstName} ${m.homePlayer.lastName}`;
        const aName = `${m.awayPlayer.firstName} ${m.awayPlayer.lastName}`;

        console.log(`${hName.padEnd(20)} ${String(m.homeScore ?? '-').padStart(2)}/${String(m.homeInnings ?? '-').padStart(2)} vs ${aName.padEnd(20)} ${String(m.awayScore ?? '-').padStart(2)}/${String(m.awayInnings ?? '-').padStart(2)}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
