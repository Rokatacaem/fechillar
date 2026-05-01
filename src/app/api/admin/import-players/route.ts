import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const data = await req.json();
        
        if (!Array.isArray(data)) {
            return NextResponse.json({ error: "Data must be an array of players" }, { status: 400 });
        }

        let createdCount = 0;
        let updatedCount = 0;

        for (const player of data) {
            if (!player.rut) continue;

            const existing = await prisma.playerProfile.findUnique({
                where: { rut: player.rut }
            });

            if (existing) {
                await prisma.playerProfile.update({
                    where: { rut: player.rut },
                    data: {
                        firstName: player.firstName || existing.firstName,
                        lastName: player.lastName || existing.lastName,
                        averageBase: player.averageBase !== undefined ? player.averageBase : existing.averageBase,
                    }
                });
                updatedCount++;
            } else {
                await prisma.playerProfile.create({
                    data: {
                        rut: player.rut,
                        slug: player.rut.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                        firstName: player.firstName || "",
                        lastName: player.lastName || "",
                        averageBase: player.averageBase || 0,
                        tenantId: player.clubId || null
                    }
                });
                createdCount++;
            }
        }

        return NextResponse.json({ success: true, created: createdCount, updated: updatedCount });

    } catch (error: any) {
        console.error("Error importing players:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
