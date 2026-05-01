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

    return NextResponse.json({ 
        message: "Diagnostics", 
        registrationDupes: dupes,
        rankingDupes: rankingDupes
    });
}
