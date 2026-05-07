import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const discipline = (searchParams.get("discipline") || "THREE_BAND") as any;
    const category = (searchParams.get("category") || "MASTER") as any;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    const rankings = await prisma.ranking.findMany({
        where: { discipline, category, points: { gt: 0 } },
        orderBy: { points: "desc" },
        take: limit,
        include: {
            player: {
                select: {
                    firstName: true,
                    lastName: true,
                    club: { select: { name: true } },
                },
            },
        },
    });

    const data = rankings
        .filter(r => !r.player.firstName?.startsWith("ELIMINADO"))
        .map((r, i) => ({
            rank: i + 1,
            name: `${r.player.firstName ?? ""} ${r.player.lastName ?? ""}`.trim(),
            club: r.player.club?.name ?? "Sin club",
            points: r.points,
            average: r.average,
        }));

    return NextResponse.json({ data, updatedAt: new Date().toISOString() });
}
