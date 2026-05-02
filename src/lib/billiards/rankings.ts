import prisma from "@/lib/prisma";
import { Discipline } from "@prisma/client";

/**
 * Calcula el 'Ranking de Poder' de la Federación.
 * Fórmula Ponderada: 
 * (Puntos Totales * 0.6) + (Promedio General * 100 * 0.3) + (Mayor Tacada Histórica * 0.1)
 */
export async function calculatePowerRanking(discipline: Discipline = "THREE_BAND") {
    // 1. Obtener todos los rankings base (Puntos y Promedios)
    const rankings = await prisma.ranking.findMany({
        where: { discipline },
        include: {
            player: {
                include: {
                    user: true,
                    club: true,
                    matchHome: true,
                    matchAway: true
                }
            }
        }
    });

    // 2. Procesar cada jugador para encontrar su Mayor Tacada (High Run)
    const powerRanking = rankings.map(r => {
        const homeRuns = r.player.matchHome.map(m => m.homeHighRun || 0);
        const awayRuns = r.player.matchAway.map(m => m.awayHighRun || 0);
        const playerMaxRun = Math.max(0, ...homeRuns, ...awayRuns);

        const basePoints = r.points || 0;
        const average = r.average || 0;

        // Cálculo Ponderado
        // Normalizamos el promedio multiplicándolo por 100 (e.g. 1.322 -> 132.2)
        const weightedScore = (basePoints * 0.6) + (average * 100 * 0.3) + (playerMaxRun * 0.1);

        return {
            playerId: r.playerId,
            name: r.player.user?.name || "Jugador SGF",
            club: r.player.club?.name || "Independiente",
            points: basePoints,
            average: average,
            highRun: playerMaxRun,
            powerScore: parseFloat(weightedScore.toFixed(3))
        };
    });

    // 3. Ordenar por Power Score descendente
    return powerRanking.sort((a, b) => b.powerScore - a.powerScore);
}
