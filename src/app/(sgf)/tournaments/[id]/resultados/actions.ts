"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { calculateStandings } from "@/lib/billiards/ranking-engine";
import { Discipline, Category } from "@prisma/client";
import { generateBracketWithAdjustment } from "@/lib/billiards/bracket-automation";

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
            matches: { select: { id: true, groupId: true } }
        }
    });

    if (!tournament) return { success: false, error: "Torneo no encontrado" };
    
    if (tournament.groups.length === 0) {
        return { success: false, error: "No se han configurado grupos para este torneo." };
    }

    const existingGroupIds = new Set(tournament.matches.map(m => m.groupId).filter(Boolean));

    const allMatches: any[] = [];
    const config = tournament.config as any;
    const inningLimit = config?.inningsPerPhase ?? 30;

    // Generar partidas para cada grupo que no tenga partidas
    tournament.groups.forEach((group) => {
        // Saltar si el grupo ya tiene partidas
        if (existingGroupIds.has(group.id)) return;

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
    revalidatePath(`/tournaments/${tournamentId}/gestion`);
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
    isWO?: boolean;
    tossWinnerId?: string | null;
}

/**
 * Persiste el resultado de una partida individual.
 */
export async function saveMatchResult(matchId: string, data: MatchResultInput) {
    const session = await auth();
    const userEmail = (session?.user as any)?.email;
    
    // Permitir si hay sesión AND (es superadmin O es el admin maestro)
    const isMasterAdmin = userEmail === "admin@fechillar.cl";
    const isSuperAdmin = (session?.user as any)?.role === "SUPERADMIN";

    if (!session || (!isMasterAdmin && !isSuperAdmin)) {
        return { success: false, error: "No autorizado" };
    }

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
                isWO: data.isWO ?? false,
                tossWinnerId: data.tossWinnerId,
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

const POSITION_POINTS: [number, number][] = [
    [1,  60],
    [2,  50],
    [4,  40],
    [8,  30],
    [12, 20],
    [32, 10],
    [Infinity, 5],
];

const getPositionPoints = (pos: number, matchesPlayed: number): number => {
    if (matchesPlayed === 0) return 0;
    for (const [until, pts] of POSITION_POINTS) {
        if (pos <= until) return pts;
    }
    return 5;
};

export async function commitTournamentRanking(tournamentId: string, forceNational = false) {
    const session = await auth();
    const userEmail = (session?.user as any)?.email;
    const userRole = (session?.user as any)?.role;
    
    const isMasterAdmin = userEmail === "admin@fechillar.cl";
    const allowedRoles = ["SUPERADMIN", "FEDERATION_ADMIN"];
    
    if (!session?.user || (!allowedRoles.includes(userRole) && !isMasterAdmin)) {
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

    const standings = calculateStandings(matches, playerIds);

    const matchesPlayedMap: Record<string, number> = {};
    playerIds.forEach(id => { matchesPlayedMap[id] = 0; });
    matches.forEach(m => {
        if (m.homeScore === null && m.awayScore === null) return;
        if (m.homePlayerId && matchesPlayedMap[m.homePlayerId] !== undefined) matchesPlayedMap[m.homePlayerId]++;
        if (m.awayPlayerId && matchesPlayedMap[m.awayPlayerId] !== undefined) matchesPlayedMap[m.awayPlayerId]++;
    });

    const isNational = tournament.scope === "NATIONAL";
    const applyNational = isNational || forceNational;

    let rankingsUpdated = 0;

    await prisma.$transaction(async (tx) => {
        for (let i = 0; i < standings.length; i++) {
            const stat = standings[i];
            const position = i + 1;
            const played = matchesPlayedMap[stat.playerId] ?? 0;
            const nationalPoints = getPositionPoints(position, played);
            const generalAverage = stat.generalAverage;

            if (applyNational) {
                const existing = await tx.ranking.findFirst({
                    where: {
                        playerId: stat.playerId,
                        discipline: tournament.discipline as Discipline,
                        category: tournament.category as Category,
                    }
                });

                if (existing) {
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
            : `Torneo cerrado (clasificación interna).`
    };
}

// ─────────────────────────────────────────────────────────
// GENERACIÓN DE LLAVES (ELIMINATORIAS)
// ─────────────────────────────────────────────────────────

/**
 * Genera la fase de eliminación directa (llaves) basada en los resultados
 * de la fase de grupos. Aplica la Fase de Ajuste si es necesario.
 */
export async function generateKnockoutPhaseAction(tournamentId: string) {
    const session = await auth();
    if (!session) return { success: false, error: "No autorizado" };

    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                matches: {
                    where: { groupId: { not: null } }
                },
                registrations: {
                    where: { status: "APPROVED" },
                    include: { player: true }
                }
            }
        });

        if (!tournament) return { success: false, error: "Torneo no encontrado" };

        const playerIds = tournament.registrations.map(r => r.playerId);
        const standings = calculateStandings(tournament.matches, playerIds);

        const playerResults = standings.map(s => ({
            playerId: s.playerId,
            groupId: "TOTAL",
            matchesPlayed: 0, 
            won: 0,
            drawn: 0,
            lost: 0,
            points: s.matchPoints,
            totalScorePonderado: 0,
            totalInnings: s.totalInnings,
            pgp: s.generalAverage,
            pm: 0,
            pp: s.particularAverage,
            pg: s.generalAverage,
            sm: s.highRun
        }));

        const bracketSize = playerIds.length <= 8 ? 8 : 16;
        const bracket = generateBracketWithAdjustment(tournamentId, playerResults, bracketSize);

        await prisma.match.deleteMany({
            where: {
                tournamentId,
                groupId: null,
                round: { gt: 1 }
            }
        });

        await prisma.match.createMany({
            data: bracket.matches.map(m => ({
                id: m.id,
                tournamentId,
                homePlayerId: m.homePlayerId,
                awayPlayerId: m.awayPlayerId,
                round: m.round,
                matchOrder: m.position + 1,
                matchDistance: (tournament.config as any)?.inningsPerPhase ?? 30,
                status: m.status as any,
                winnerId: m.winnerId,
            }))
        });

        revalidatePath(`/tournaments/${tournamentId}/llaves`);
        revalidatePath(`/tournaments/${tournamentId}/resultados`);

        return { success: true };
    } catch (error: any) {
        console.error("Error generating bracket:", error);
        return { success: false, error: error.message };
    }
}
