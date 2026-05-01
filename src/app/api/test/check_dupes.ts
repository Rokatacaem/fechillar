import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
    const tournamentId = "667636e0-0ef5-46f4-a690-349f96b6fca2"; // I'll try to guess or find the ID from the logs if possible. 
    // Actually, I don't have the ID. I'll just search for ANY duplicates in registrations.
    
    console.log("Searching for duplicate registration IDs...");
    const dupes = await prisma.$queryRaw`
        SELECT id, COUNT(*) 
        FROM "TournamentRegistration" 
        GROUP BY id 
        HAVING COUNT(*) > 1
    `;
    console.log("Duplicate IDs in TournamentRegistration:", dupes);

    const dupesByTournament = await prisma.$queryRaw`
        SELECT "tournamentId", "playerId", COUNT(*) 
        FROM "TournamentRegistration" 
        GROUP BY "tournamentId", "playerId" 
        HAVING COUNT(*) > 1
    `;
    console.log("Duplicate [tournamentId, playerId] in TournamentRegistration:", dupesByTournament);

    // Let's check the query results for a specific tournament (if I can find it)
    // The user's error message doesn't have the tournament ID.
}

test();
