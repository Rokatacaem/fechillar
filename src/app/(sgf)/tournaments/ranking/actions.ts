"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const POINTS_SCALE = {
    WINNER: 60,
    RUNNER_UP: 40,
    SEMIS: 28,         // N-1
    QUARTERS: 20,      // N-2
    ROUND_16: 12,      // N-3
    ROUND_32: 6        // N-4
};

function getPointsForEliminationRound(eliminatedRound: number, maxRound: number): number {
    const diff = maxRound - eliminatedRound;
    if (diff === 0) return POINTS_SCALE.RUNNER_UP;
    if (diff === 1) return POINTS_SCALE.SEMIS;
    if (diff === 2) return POINTS_SCALE.QUARTERS;
    if (diff === 3) return POINTS_SCALE.ROUND_16;
    return POINTS_SCALE.ROUND_32; // Default rest
}

export async function closeTournament(tournamentId: string) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("No autorizado");
    }

    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { matches: true }
        });

        if (!tournament) throw new Error("Torneo no encontrado");
        if (tournament.status === "FINISHED") {
            return { success: false, error: "El torneo ya fue clausurado." };
        }

        const matches = tournament.matches;
        if (matches.length === 0) {
            throw new Error("El torneo no tiene partidos generados.");
        }

        // 1. Determinar Rondas
        const rounds = Array.from(new Set(matches.map(m => m.round)));
        const maxRound = Math.max(...rounds);
        
        // La gran final
        const finalMatches = matches.filter(m => m.round === maxRound);
        if (finalMatches.length === 0 || !finalMatches[0].winnerId) {
            throw new Error("No se puede clausurar: La Final aún no tiene un ganador registrado.");
        }
        
        const championId = finalMatches[0].winnerId;

        // 2. Mapear Eliminaciones
        const playerEliminatedInRound = new Map<string, number>();
        const allPlayers = new Set<string>();

        for (const m of matches) {
            if (m.homePlayerId && m.homePlayerId !== "TBD" && m.homePlayerId !== "ERROR") allPlayers.add(m.homePlayerId);
            if (m.awayPlayerId && m.awayPlayerId !== "TBD" && m.awayPlayerId !== "ERROR") allPlayers.add(m.awayPlayerId);

            if (m.winnerId && m.awayPlayerId && m.homePlayerId) {
                const loser = m.winnerId === m.homePlayerId ? m.awayPlayerId : m.homePlayerId;
                // Ignorar propagación de TBD (Huecos vacíos)
                if (loser !== "TBD" && loser !== "ERROR") {
                    playerEliminatedInRound.set(loser, m.round);
                }
            }
        }

        // 3. Asignación transaccional de Puntos y Registro
        await prisma.$transaction(async (tx) => {
            // Actualizar Torneo
            await tx.tournament.update({
                where: { id: tournamentId },
                data: { status: "FINISHED" } // Ahora es un Enum
            });

            // Asignar Puntos a Jugadores
            for (const playerId of allPlayers) {
                let pointsEarned = 0;

                if (playerId === championId) {
                    pointsEarned = POINTS_SCALE.WINNER;
                } else if (playerEliminatedInRound.has(playerId)) {
                    const elRound = playerEliminatedInRound.get(playerId)!;
                    pointsEarned = getPointsForEliminationRound(elRound, maxRound);
                }

                if (pointsEarned > 0) {
                    // Buscar o crear Ranking Matrix
                    const existingRanking = await tx.ranking.findFirst({
                        where: { playerId, discipline: tournament.discipline, category: tournament.category }
                    });

                    if (existingRanking) {
                        await tx.ranking.update({
                            where: { id: existingRanking.id },
                            data: { points: existingRanking.points + pointsEarned }
                        });
                    } else {
                        await tx.ranking.create({
                            data: {
                                playerId,
                                discipline: tournament.discipline,
                                category: tournament.category,
                                points: pointsEarned
                            }
                        });
                    }
                }
            }

            // Crear Log de Auditoría
            await tx.auditLog.create({
                data: {
                    action: "TOURNAMENT_CLOSURE",
                    targetId: tournamentId,
                    userId: session.user.id || "",
                    details: `Torneo ${tournament.name} clausurado. Campeón asignado: +60 puntos.`
                }
            });
        });

        return { success: true, message: "Torneo Clausurado y Puntos Distribuidos Exitosamente" };

    } catch (error: any) {
        console.error("Closure Error:", error);
        return { success: false, error: error.message || "Error Interno en la Clausura." };
    }
}
