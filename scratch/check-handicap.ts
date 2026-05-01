import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
    const tournamentId = "f023a37d-3350-4c19-aeaf-e5b46f20a76d";
    
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId }
    });

    console.log(`Tournament: ${tournament?.name}`);
    console.log(`isHandicap: ${tournament?.isHandicap}`);
}

check();
