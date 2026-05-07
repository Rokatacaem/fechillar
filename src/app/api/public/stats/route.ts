import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const [players, clubs, tournaments] = await Promise.all([
        prisma.playerProfile.count({
            where: { NOT: { firstName: { startsWith: "ELIMINADO" } } },
        }),
        prisma.club.count(),
        prisma.tournament.count({
            where: { status: { not: "DRAFT" }, startDate: { gte: new Date() } },
        }),
    ]);

    return NextResponse.json({ players, clubs, upcomingTournaments: tournaments });
}
