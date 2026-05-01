import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debug() {
    const tournamentId = "f023a37d-3350-4c19-aeaf-e5b46f20a76d";
    
    console.log(`Debuging matches for tournament: ${tournamentId}`);
    
    const matchesWithoutGroup = await prisma.match.findMany({
        where: {
            tournamentId: tournamentId,
            groupId: null
        },
        include: {
            homePlayer: true,
            awayPlayer: true,
            phase: true
        }
    });

    console.log(`Found ${matchesWithoutGroup.length} matches without groupId.`);
    
    matchesWithoutGroup.forEach(m => {
        console.log(`- Match ID: ${m.id} | Phase: ${m.phase?.name} | ${m.homePlayer?.firstName} vs ${m.awayPlayer?.firstName}`);
    });

    const groups = await prisma.tournamentGroup.findMany({
        where: { tournamentId },
        include: { _count: { select: { matches: true } } }
    });

    console.log("\nGroups in tournament:");
    groups.forEach(g => {
        console.log(`- Group ${g.name} (ID: ${g.id}): ${g._count.matches} matches`);
    });
}

debug();
