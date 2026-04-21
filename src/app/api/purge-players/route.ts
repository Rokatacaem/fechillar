import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        await prisma.$transaction([
            prisma.match.deleteMany({}),
            prisma.tournamentGroup.deleteMany({}),
            prisma.tournamentRegistration.deleteMany({}),
            prisma.ranking.deleteMany({}),
            prisma.transferRequest.deleteMany({}),
            prisma.playerProfile.deleteMany({}),
        ]);

        return NextResponse.json({ 
            success: true, 
            message: "Purga completada: Todos los jugadores, rankings e inscripciones a torneos han sido eliminados correctamente de todos los clubes." 
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
