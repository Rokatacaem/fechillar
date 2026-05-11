import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const secret = process.env.SYNC_SECRET;
    if (!secret || req.headers.get("x-sync-secret") !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const dbUrl = process.env.DATABASE_URL || "(vacío)";
        const host = dbUrl.replace(/:\/\/[^:]+:[^@]+@/, "://***:***@").substring(0, 100);
        const players = await prisma.playerProfile.count();
        const clubs = await prisma.club.count();
        const rankings = await prisma.ranking.count();
        return NextResponse.json({ host, players, clubs, rankings });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, host: (process.env.DATABASE_URL || "").substring(0, 40) }, { status: 500 });
    }
}
