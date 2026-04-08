"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Busca jugadores en la base de datos según el nombre, rut y club.
 * Limitado a 10 resultados para optimizar la interfaz.
 */
export async function searchPlayers(query: string) {
    if (!query || query.length < 2) return [];

    const session = await auth();
    if (!session) return [];

    try {
        const players = await prisma.playerProfile.findMany({
            where: {
                OR: [
                    { user: { name: { contains: query, mode: "insensitive" } } },
                    { rut: { contains: query, mode: "insensitive" } }
                ]
            },
            include: {
                user: true,
                club: { select: { name: true } }
            },
            take: 10
        });

        return players.map(p => ({
            id: p.id,
            name: p.user?.name || "Sin Nombre",
            rut: p.rut,
            club: p.club?.name || "Agente Libre"
        }));
    } catch (error) {
        console.error("Error searching players:", error);
        return [];
    }
}
