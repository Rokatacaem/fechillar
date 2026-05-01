import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Buscar por nombre aproximado
        const player = await prisma.playerProfile.findFirst({
            where: {
                AND: [
                    { firstName: { contains: 'Alejandro', mode: 'insensitive' } },
                    { lastName: { contains: 'Carvaj', mode: 'insensitive' } } // Captura Carvaja y Carvajal
                ]
            }
        });

        if (!player) {
            const allAlejandros = await prisma.playerProfile.findMany({
                where: { firstName: { contains: 'Alejandro', mode: 'insensitive' } },
                select: { firstName: true, lastName: true }
            });
            return NextResponse.json({ error: "No encontrado", sugerencias: allAlejandros });
        }

        const updated = await prisma.playerProfile.update({
            where: { id: player.id },
            data: { averageBase: 0.957 }
        });

        await prisma.ranking.updateMany({
            where: { playerId: player.id },
            data: { average: 0.957 }
        });

        return NextResponse.json({ 
            success: true, 
            player: `${updated.firstName} ${updated.lastName}`,
            newAverage: updated.averageBase 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
