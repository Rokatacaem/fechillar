import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    const dupes = await prisma.$queryRaw`
        SELECT id, COUNT(*) 
        FROM "TournamentRegistration" 
        GROUP BY id 
        HAVING COUNT(*) > 1
    `;

    const rankingDupes = await prisma.$queryRaw`
        SELECT "playerId", discipline, COUNT(*) 
        FROM "Ranking" 
        GROUP BY "playerId", discipline
        HAVING COUNT(*) > 1
    `;

    const playerCount = await prisma.playerProfile.count();
    const clubCount = await prisma.club.count();
    
    let tournaments = [];
    let tournamentError = null;
    try {
        tournaments = await prisma.tournament.findMany({
            include: { hostClub: true, creator: { select: { name: true } } }
        });
    } catch (e: any) {
        tournamentError = e.message;
    }

    return NextResponse.json({ 
        message: "Diagnostics", 
        playerCount,
        clubCount,
        tournaments: tournaments.length,
        tournamentError,
        registrationDupes: dupes,
        rankingDupes: rankingDupes
    });
}
