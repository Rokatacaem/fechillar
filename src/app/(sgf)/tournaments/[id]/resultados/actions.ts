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

    const alreadyFinished = tournament.status === "FINISHED";
    const matches = tournament.matches;
    const pendingMatches = matches.filter(m => m.homePlayerId && m.awayPlayerId && m.homeScore === null);
    if (pendingMatches.length > 0) {
        return {
            success: false,
            error: `Hay ${pendingMatches.length} partidas sin resultado. Completa todos los resultados antes de cerrar.`
        };
    }

    let playerIds = tournament.registrations.map(r => r.playerId);
    if (playerIds.length === 0) {
        // Fallback: derive players from match participants (for tournaments without formal registrations)
        const matchPlayerIds = new Set<string>();
        matches.forEach(m => {
            if (m.homePlayerId) matchPlayerIds.add(m.homePlayerId);
            if (m.awayPlayerId) matchPlayerIds.add(m.awayPlayerId);
        });
        playerIds = Array.from(matchPlayerIds);
    }
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

            if (applyNational && !alreadyFinished) {
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

        // Eliminar TODOS los cruces de llave anteriores (cualquier ronda, sin grupo)
        await prisma.match.deleteMany({
            where: { tournamentId, groupId: null }
        });

        const isRealId = (id: string | null) =>
            !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        await prisma.match.createMany({
            data: bracket.matches.map(m => ({
                id: m.id,
                tournamentId,
                homePlayerId: isRealId(m.homePlayerId) ? m.homePlayerId : null,
                awayPlayerId: isRealId(m.awayPlayerId) ? m.awayPlayerId : null,
                round: m.round,
                matchOrder: m.position + 1,
                matchDistance: (tournament.config as any)?.inningsPerPhase ?? 30,
                winnerId: isRealId(m.winnerId) ? m.winnerId : null,
                isWO: m.isBye,
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

// ─────────────────────────────────────────────────────────
// REPORTE WHATSAPP
// ─────────────────────────────────────────────────────────

export async function getTournamentWhatsAppReport(tournamentId: string): Promise<string> {
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            groups: {
                include: {
                    matches: {
                        include: {
                            homePlayer: { select: { firstName: true, lastName: true } },
                            awayPlayer: { select: { firstName: true, lastName: true } },
                        }
                    },
                    registrations: {
                        include: {
                            player: { select: { id: true, firstName: true, lastName: true } }
                        }
                    }
                },
                orderBy: { order: "asc" }
            },
            matches: {
                include: {
                    homePlayer: { select: { firstName: true, lastName: true } },
                    awayPlayer: { select: { firstName: true, lastName: true } },
                },
                orderBy: [{ round: "asc" }, { matchOrder: "asc" }]
            }
        }
    });

    if (!tournament) return "Torneo no encontrado";

    const allMatches = [
        ...tournament.groups.flatMap(g => g.matches),
        ...tournament.matches
    ];
    const totalMatches = allMatches.length;
    const isPlayed = (m: any) => m.winnerId !== null || m.isWO || (m.homeInnings ?? 0) > 0;
    const completedMatches = allMatches.filter(isPlayed).length;

    // Calcular posiciones por grupo
    const playerName = (p: any) => `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim();

    let groupLines = "";
    for (const group of tournament.groups) {
        const playerStats: Record<string, { name: string; pts: number; carom: number; innings: number; hr: number }> = {};
        for (const reg of group.registrations) {
            const id = reg.player.id;
            playerStats[id] = { name: playerName(reg.player), pts: 0, carom: 0, innings: 0, hr: 0 };
        }

        for (const m of group.matches) {
            if (!isPlayed(m) || !m.homePlayerId || !m.awayPlayerId) continue;
            const h = m.homePlayerId;
            const a = m.awayPlayerId;
            if (playerStats[h] && playerStats[a]) {
                if (m.winnerId === h) playerStats[h].pts += 2;
                else if (m.winnerId === a) playerStats[a].pts += 2;
                playerStats[h].carom += m.homeScore ?? 0;
                playerStats[h].innings += m.homeInnings ?? 0;
                playerStats[h].hr = Math.max(playerStats[h].hr, m.homeHighRun ?? 0);
                playerStats[a].carom += m.awayScore ?? 0;
                playerStats[a].innings += m.awayInnings ?? 0;
                playerStats[a].hr = Math.max(playerStats[a].hr, m.awayHighRun ?? 0);
            }
        }

        const sorted = Object.values(playerStats).sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            const avgA = a.innings > 0 ? a.carom / a.innings : 0;
            const avgB = b.innings > 0 ? b.carom / b.innings : 0;
            return avgB - avgA;
        });

        const completedInGroup = group.matches.filter(isPlayed).length;
        groupLines += `\n*${group.name}* (${completedInGroup}/${group.matches.length})\n`;
        sorted.forEach((p, i) => {
            const avg = p.innings > 0 ? (p.carom / p.innings).toFixed(3) : "0.000";
            groupLines += `${i + 1}. ${p.name} — ${p.pts}pts | pg: ${avg}\n`;
        });
    }

    // Eliminatorias (si hay)
    const knockoutMatches = tournament.matches.filter(m => m.groupId === null);
    let knockoutLines = "";
    if (knockoutMatches.length > 0) {
        const recent = knockoutMatches.filter(isPlayed).slice(-4);
        if (recent.length > 0) {
            knockoutLines = "\n*🏆 ELIMINATORIAS*\n";
            for (const m of recent) {
                const winner = m.winnerId === m.homePlayerId ? playerName(m.homePlayer) : playerName(m.awayPlayer);
                knockoutLines += `✅ ${playerName(m.homePlayer)} ${m.homeScore}-${m.awayScore} ${playerName(m.awayPlayer)} → *${winner}*\n`;
            }
        }
    }

    const pct = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
    const now = new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });

    return `🎱 *${tournament.name.toUpperCase()}*
📅 FECHILLAR | ${now}

📊 *POSICIONES*${groupLines}${knockoutLines}
▶️ Partidas: ${completedMatches}/${totalMatches} completadas (${pct}%)

🔗 Seguimiento en vivo:
fechillar-three.vercel.app/torneos/${tournamentId}`;
}
