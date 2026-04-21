"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { calculateStandings } from "@/lib/billiards/ranking-engine";
import { Discipline, Category } from "@prisma/client";

// ─────────────────────────────────────────────────────────
// GENERACIÓN DE CRUCES ROUND ROBIN
// ─────────────────────────────────────────────────────────

/**
 * Genera automáticamente las partidas Round Robin para todos los
 * jugadores inscritos en el torneo. Si ya existen partidas, aborta.
 * 
 * Algoritmo: Combinación única de pares (n choose 2).
 * Todos contra todos, sin repeticiones.
 */
export async function generateRoundRobinMatches(tournamentId: string) {
    const session = await auth();
    if (!session) return { success: false, error: "No autorizado" };

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            registrations: {
                where: { status: "APPROVED" },
                select: { playerId: true }
            },
            matches: { select: { id: true } }
        }
    });

    if (!tournament) return { success: false, error: "Torneo no encontrado" };
    if (tournament.matches.length > 0) {
        return { success: false, error: `Ya existen ${tournament.matches.length} partidas. Elimínalas primero para regenerar.` };
    }

    const playerIds = tournament.registrations.map(r => r.playerId);
    if (playerIds.length < 2) {
        return { success: false, error: "Se necesitan al menos 2 jugadores inscritos para generar partidas." };
    }

    // Generar todas las combinaciones únicas (RR completo)
    const pairs: { home: string; away: string }[] = [];
    for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
            pairs.push({ home: playerIds[i], away: playerIds[j] });
        }
    }

    // Extraer límite de entradas del config del torneo
    const config = tournament.config as any;
    const inningLimit = config?.inningsPerPhase ?? 30;

    await prisma.match.createMany({
        data: pairs.map((pair, idx) => ({
            tournamentId,
            homePlayerId: pair.home,
            awayPlayerId: pair.away,
            round: 1,
            matchOrder: idx + 1,
            matchDistance: inningLimit,
        }))
    });

    revalidatePath(`/tournaments/${tournamentId}/resultados`);
    return { success: true, matchesGenerated: pairs.length };
}

/**
 * Genera partidas Round Robin independientes para cada grupo del torneo.
 */
export async function generateMatchesByGroup(tournamentId: string) {
    const session = await auth();
    if (!session) return { success: false, error: "No autorizado" };

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            groups: {
                include: {
                    registrations: {
                        where: { status: { in: ["APPROVED", "PENDING"] } },
                        select: { playerId: true, groupOrder: true }
                    }
                }
            },
            matches: { select: { id: true } }
        }
    });

    if (!tournament) return { success: false, error: "Torneo no encontrado" };
    if (tournament.matches.length > 0) {
        return { success: false, error: `Ya existen partidas. Elimínalas primero para regenerar.` };
    }

    if (tournament.groups.length === 0) {
        return { success: false, error: "No se han configurado grupos para este torneo." };
    }

    const allMatches: any[] = [];
    const config = tournament.config as any;
    const inningLimit = config?.inningsPerPhase ?? 30;

    // Generar partidas para cada grupo
    tournament.groups.forEach((group) => {
        const players = group.registrations.map(r => r.playerId);
        if (players.length < 2) return;

        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                allMatches.push({
                    tournamentId,
                    groupId: group.id,
                    homePlayerId: players[i],
                    awayPlayerId: players[j],
                    round: 1,
                    matchOrder: allMatches.length + 1,
                    matchDistance: inningLimit,
                });
            }
        }
    });

    if (allMatches.length === 0) {
        return { success: false, error: "No se pudieron generar partidas (insuficientes jugadores por grupo)." };
    }

    await prisma.match.createMany({ data: allMatches });

    revalidatePath(`/tournaments/${tournamentId}/resultados`);
    return { success: true, matchesGenerated: allMatches.length };
}

// ─────────────────────────────────────────────────────────
// GUARDAR RESULTADO DE UNA PARTIDA
// ─────────────────────────────────────────────────────────

export interface MatchResultInput {
    homeScore: number;
    awayScore: number;
    homeInnings: number;
    awayInnings: number;
    homeHighRun: number;
    awayHighRun: number;
    winnerId: string | null; // playerId del ganador, o null para empate
    refereeName?: string | null; // Nombre del árbitro (texto libre)
}

/**
 * Persiste el resultado de una partida individual.
 */
export async function saveMatchResult(matchId: string, data: MatchResultInput) {
    const session = await auth();
    if (!session) return { success: false, error: "No autorizado" };

    try {
        await prisma.match.update({
            where: { id: matchId },
            data: {
                homeScore: data.homeScore,
                awayScore: data.awayScore,
                homeInnings: data.homeInnings,
                awayInnings: data.awayInnings,
                homeHighRun: data.homeHighRun,
                awayHighRun: data.awayHighRun,
                winnerId: data.winnerId,
                refereeName: data.refereeName,
            }
        });

        const match = await prisma.match.findUnique({ where: { id: matchId }, select: { tournamentId: true } });
        revalidatePath(`/tournaments/${match?.tournamentId}/resultados`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─────────────────────────────────────────────────────────
// CERRAR TORNEO Y COMMIT DE RANKINGS
// ─────────────────────────────────────────────────────────

/**
 * Tabla oficial de puntos por posición final (Fechillar SGF).
 * Mínimo de 5 puntos SOLO si el jugador disputó al menos 1 partida.
 * Si no jugó ningún partido: 0 puntos.
 */
const POSITION_POINTS: [number, number][] = [
    //  [hasta_posición_inclusiva, puntos]
    [1,  60],
    [2,  50],
    [4,  40],   // posición 3 y 4
    [8,  30],   // posición 5 a 8
    [12, 20],   // posición 9 a 12
    [32, 10],   // posición 13 a 32
    [Infinity, 5], // posición 33+ (solo si jugó al menos 1 partida)
];

/**
 * @param pos - Posición final (1-based)
 * @param matchesPlayed - Cantidad de partidas jugadas por el jugador
 */
const getPositionPoints = (pos: number, matchesPlayed: number): number => {
    // Regla: si no jugó ninguna partida, no recibe puntos (ni el mínimo)
    if (matchesPlayed === 0) return 0;
    for (const [until, pts] of POSITION_POINTS) {
        if (pos <= until) return pts;
    }
    return 5;
};

/**
 * Cierra el torneo, calcula la clasificación final y persiste los
 * puntos en el Ranking Nacional (solo si scope=NATIONAL y homologado o forzado).
 * Genera un RankingSnapshot por jugador (foto histórica inmutable).
 * 
 * @param forceNational - Si true, sube puntos aunque el torneo no esté APPROVED.
 *                        Útil para torneos retroactivos validados manualmente.
 */
export async function commitTournamentRanking(tournamentId: string, forceNational = false) {
    const session = await auth();
    const allowedRoles = ["SUPERADMIN", "FEDERATION_ADMIN"];
    if (!session || !allowedRoles.includes((session.user as any)?.role)) {
        return { success: false, error: "No autorizado" };
    }

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            matches: true,
            registrations: { where: { status: "APPROVED" }, select: { playerId: true } }
        }
    });

    if (!tournament) return { success: false, error: "Torneo no encontrado" };

    const matches = tournament.matches;
    const pendingMatches = matches.filter(m => m.homePlayerId && m.awayPlayerId && m.homeScore === null);
    if (pendingMatches.length > 0) {
        return {
            success: false,
            error: `Hay ${pendingMatches.length} partidas sin resultado. Completa todos los resultados antes de cerrar.`
        };
    }

    const playerIds = tournament.registrations.map(r => r.playerId);
    if (playerIds.length === 0) return { success: false, error: "No hay jugadores inscritos" };

    // Calcular clasificación usando el motor de rankings existente
    const standings = calculateStandings(matches, playerIds);

    // Precalcular partidas jugadas por jugador
    const matchesPlayedMap: Record<string, number> = {};
    playerIds.forEach(id => { matchesPlayedMap[id] = 0; });
    matches.forEach(m => {
        if (m.homeScore === null && m.awayScore === null) return; // sin resultado
        if (m.homePlayerId && matchesPlayedMap[m.homePlayerId] !== undefined) matchesPlayedMap[m.homePlayerId]++;
        if (m.awayPlayerId && matchesPlayedMap[m.awayPlayerId] !== undefined) matchesPlayedMap[m.awayPlayerId]++;
    });

    // ¿Aplica ranking nacional?
    const isNational = tournament.scope === "NATIONAL";
    const isApproved = tournament.officializationStatus === "APPROVED";
    const applyNational = isNational && (isApproved || forceNational);

    let rankingsUpdated = 0;

    await prisma.$transaction(async (tx) => {
        for (let i = 0; i < standings.length; i++) {
            const stat = standings[i];
            const position = i + 1;
            const played = matchesPlayedMap[stat.playerId] ?? 0;
            const nationalPoints = getPositionPoints(position, played);
            const generalAverage = stat.generalAverage;

            if (applyNational) {
                // Upsert en Ranking: acumular puntos y recalcular promedio ponderado
                const existing = await tx.ranking.findFirst({
                    where: {
                        playerId: stat.playerId,
                        discipline: tournament.discipline as Discipline,
                        category: tournament.category as Category,
                    }
                });

                if (existing) {
                    // Promedio ponderado: mezcla el histórico con el nuevo torneo
                    const newAvg = existing.average
                        ? (existing.average * 0.7 + generalAverage * 0.3)
                        : generalAverage;

                    await tx.ranking.update({
                        where: { id: existing.id },
                        data: {
                            points: existing.points + nationalPoints,
                            average: parseFloat(newAvg.toFixed(4)),
                        }
                    });
                } else {
                    await tx.ranking.create({
                        data: {
                            playerId: stat.playerId,
                            discipline: tournament.discipline as Discipline,
                            category: tournament.category as Category,
                            points: nationalPoints,
                            average: parseFloat(generalAverage.toFixed(4)),
                            handicapTarget: 15,
                        }
                    });
                }

                rankingsUpdated++;
            }

            // Snapshot histórico SIEMPRE (independiente de si es nacional)
            const currentRanking = await tx.ranking.findFirst({
                where: {
                    playerId: stat.playerId,
                    discipline: tournament.discipline as Discipline,
                }
            });

            await tx.rankingSnapshot.create({
                data: {
                    playerId: stat.playerId,
                    discipline: tournament.discipline as Discipline,
                    category: tournament.category as Category,
                    points: currentRanking?.points ?? nationalPoints,
                    rankPosition: position,
                    average: parseFloat(generalAverage.toFixed(4)),
                    powerScore: stat.matchPoints + generalAverage * 10,
                    snapshotDate: tournament.endDate ?? new Date(),
                }
            });
        }

        // Marcar torneo como FINISHED
        await tx.tournament.update({
            where: { id: tournamentId },
            data: { status: "FINISHED" }
        });
    });

    revalidatePath(`/tournaments/${tournamentId}/ranking`);
    revalidatePath("/tournaments");
    revalidatePath("/rankings");

    return {
        success: true,
        standings: standings.map((s, i) => ({
            position: i + 1,
            playerId: s.playerId,
            points: s.matchPoints,
            average: s.generalAverage.toFixed(3),
            matchesPlayed: matchesPlayedMap[s.playerId] ?? 0,
            nationalPoints: applyNational ? getPositionPoints(i + 1, matchesPlayedMap[s.playerId] ?? 0) : 0
        })),
        rankingsUpdated,
        applyNational,
        message: applyNational
            ? `Torneo cerrado. ${rankingsUpdated} rankings nacionales actualizados.`
            : `Torneo cerrado (clasificación interna). Para subir al Ranking Nacional, homologa el torneo primero.`
    };
}
