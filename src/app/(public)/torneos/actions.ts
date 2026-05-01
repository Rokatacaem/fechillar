"use server";

import prisma from "@/lib/prisma";
import { getGroupStandings } from "@/lib/standings";

export async function getPublicTournamentData(tournamentId: string) {
    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                groups: true,
                phases: { orderBy: { order: 'asc' } },
                hostClub: true
            }
        });

        if (!tournament) return { success: false, error: "Torneo no encontrado" };

        // 1. Calcular tablas de posiciones para todos los grupos
        const groupsWithStandings = await Promise.all(
            tournament.groups.map(async (group) => {
                const standings = await getGroupStandings(group.id);
                return {
                    ...group,
                    standings
                };
            })
        );

        // 2. Obtener partidos en vivo y brackets
        const matches = await prisma.match.findMany({
            where: { tournamentId },
            include: {
                homePlayer: { include: { user: true } },
                awayPlayer: { include: { user: true } },
                phase: true
            },
            orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }]
        });

        // 3. Ranking General (Todos los jugadores ordenados por criterios federados)
        const allStandings = groupsWithStandings
            .flatMap(g => g.standings)
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.average !== a.average) return b.average - a.average;
                return b.highRun - a.highRun;
            });
        
        const topByAvg = [...allStandings].sort((a, b) => b.average - a.average).slice(0, 5);
        const topByHighRun = [...allStandings].sort((a, b) => b.highRun - a.highRun).slice(0, 5);

        return {
            success: true,
            tournament,
            groups: groupsWithStandings,
            matches,
            allStandings, // Ranking 1-54
            topPerformers: {
                byAverage: topByAvg,
                byHighRun: topByHighRun
            }
        };

    } catch (error: any) {
        console.error("Public Data Fetch Error:", error);
        return { success: false, error: "Error al cargar datos públicos" };
    }
}
