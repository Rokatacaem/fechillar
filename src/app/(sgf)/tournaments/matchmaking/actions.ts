"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { evaluateMatchWinner } from "@/lib/billiards/match-engine";

/**
 * Genera el orden de siembra protegida (Butterfly) para un tamaño de bracket dado.
 */
function getButterflySeeds(size: number): number[] {
    let seeds = [1];
    while (seeds.length < size) {
        const nextSeeds = [];
        for (const seed of seeds) {
            nextSeeds.push(seed);
            nextSeeds.push(seeds.length * 2 + 1 - seed);
        }
        seeds = nextSeeds;
    }
    return seeds;
}

export async function generateBrackets(tournamentId: string) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("No autorizado");
    }

    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { registrations: { include: { player: { include: { rankings: true } } } } }
        });

        if (!tournament) throw new Error("Torneo no encontrado");

        // Eliminar llaves existentes del torneo para regenerar
        await prisma.match.deleteMany({
            where: { tournamentId }
        });

        // Obtener jugadores aptos: APROBADOS o PAGADOS
        const registrations = await prisma.tournamentRegistration.findMany({
            where: { 
                tournamentId, 
                OR: [
                    { status: "APPROVED" },
                    { paymentStatus: "PAID" }
                ],
                isWaitingList: false
            },
            include: {
                player: {
                    include: {
                        user: true,
                        rankings: {
                            where: { discipline: tournament.discipline }
                        }
                    }
                }
            },
            orderBy: { registeredPoints: 'desc' }
        });

        if (registrations.length < 2) {
            throw new Error("Se necesitan al menos 2 jugadores válidos para generar llaves.");
        }

        const numPlayers = registrations.length;
        
        // Calcular potencia de 2 más cercana hacia arriba
        let bracketSize = 1;
        while (bracketSize < numPlayers) {
            bracketSize *= 2;
        }

        // Obtener orden de siembra protegida
        const seeds = getButterflySeeds(bracketSize);
        const matchesToCreate = [];
        const totalMatches = bracketSize / 2;

        for (let i = 0; i < totalMatches; i++) {
            const seedHome = seeds[i * 2];
            const seedAway = seeds[i * 2 + 1];

            const homeReg = registrations[seedHome - 1]; 
            const awayReg = registrations[seedAway - 1];

            // Obtener metas de hándicap (default 15 si no hay ranking específico)
            const homeTarget = homeReg?.player?.rankings?.[0]?.handicapTarget ?? 15;
            const awayTarget = awayReg?.player?.rankings?.[0]?.handicapTarget ?? 15;

            matchesToCreate.push({
                tournamentId,
                round: 1,
                matchOrder: i + 1,
                homePlayerId: homeReg?.playerId ?? null,
                awayPlayerId: awayReg?.playerId ?? null,
                homeTarget,
                awayTarget,
                isWO: homeReg && !awayReg, // Si hay home pero no away, es bye
                winnerId: (homeReg && !awayReg) ? homeReg.playerId : null
            });
        }

        await prisma.match.createMany({
            data: matchesToCreate
        });

        return { success: true, bracketSize, generatedMatches: matchesToCreate.length };

    } catch (error: any) {
        console.error("Error generating brackets:", error);
        return { success: false, error: error.message || "Error interno al generar cuadros." };
    }
}

export async function submitMatchResult(
    matchId: string, 
    homeScore: number, 
    awayScore: number, 
    homeInnings: number = 0, 
    awayInnings: number = 0
) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("No autorizado");
    }

    try {
        const match = await prisma.match.findUnique({ 
            where: { id: matchId },
            include: { phase: true }
        });
        if (!match) throw new Error("Match no encontrado");

        // Evaluar ganador con el nuevo motor hándicap y profesional
        const result = evaluateMatchWinner({
            homeScore,
            awayScore,
            homeTarget: match.homeTarget ?? 15,
            awayTarget: match.awayTarget ?? 15,
            homeInnings,
            awayInnings,
            hasEqualizingInning: match.phase?.hasEqualizingInning ?? true,
            inningLimit: match.phase?.inningLimit ?? 30
        });

        let winnerId = null;
        if (result.winner === 'HOME') winnerId = match.homePlayerId;
        else if (result.winner === 'AWAY') winnerId = match.awayPlayerId;

        // Actualizar el partido actual
        await prisma.match.update({
            where: { id: matchId },
            data: {
                homeScore,
                awayScore,
                homeInnings,
                awayInnings,
                winnerId
            }
        });

        // ============================================
        // PERSISTENCIA EN PERFIL HISTÓRICO (PGP)
        // ============================================
        const tournament = await prisma.tournament.findUnique({
            where: { id: match.tournamentId }
        });

        if (tournament) {
            // Actualizar Ranking para Home
            if (match.homePlayerId) {
                const homePGP = homeInnings > 0 ? (homeScore / homeInnings) : 0;
                await prisma.ranking.upsert({
                    where: {
                        playerId_discipline_category: {
                            playerId: match.homePlayerId,
                            discipline: tournament.discipline,
                            category: tournament.category
                        }
                    },
                    update: { average: homePGP },
                    create: {
                        playerId: match.homePlayerId,
                        discipline: tournament.discipline,
                        category: tournament.category,
                        average: homePGP,
                        handicapTarget: match.homeTarget || 15
                    }
                });
            }

            // Actualizar Ranking para Away
            if (match.awayPlayerId) {
                const awayPGP = awayInnings > 0 ? (awayScore / awayInnings) : 0;
                await prisma.ranking.upsert({
                    where: {
                        playerId_discipline_category: {
                            playerId: match.awayPlayerId,
                            discipline: tournament.discipline,
                            category: tournament.category
                        }
                    },
                    update: { average: awayPGP },
                    create: {
                        playerId: match.awayPlayerId,
                        discipline: tournament.discipline,
                        category: tournament.category,
                        average: awayPGP,
                        handicapTarget: match.awayTarget || 15
                    }
                });
            }
        }

        // ============================================
        // PROPAGAR GANADOR A SIGUIENTE RONDA
        // ============================================
        if (winnerId) {
            const nextRound = match.round + 1;
            const nextMatchOrder = Math.ceil(match.matchOrder / 2);
            const isNextHome = match.matchOrder % 2 !== 0;

            // Busca si ya existe el match de la sig ronda
            const nextMatch = await prisma.match.findFirst({
                where: {
                    tournamentId: match.tournamentId,
                    round: nextRound,
                    matchOrder: nextMatchOrder
                }
            });

            if (nextMatch) {
                await prisma.match.update({
                    where: { id: nextMatch.id },
                    data: isNextHome ? { homePlayerId: winnerId } : { awayPlayerId: winnerId }
                });
            } else {
                // Generar match placeholder si no existe (Útil para brackets asíncronos)
                await prisma.match.create({
                    data: {
                        tournamentId: match.tournamentId,
                        round: nextRound,
                        matchOrder: nextMatchOrder,
                        homePlayerId: isNextHome ? winnerId : null,
                        awayPlayerId: isNextHome ? null : winnerId,
                        homeTarget: 15, // Default, será actualizado cuando el oponente clasifique
                        awayTarget: 15
                    }
                });
            }
        }

        return { success: true, winnerId, reason: result.reason };

    } catch (error: any) {
        console.error("Propagation error:", error);
        return { success: false, error: "Error en la validación y propagación del bracket." };
    }
}

/**
 * Genera 8 grupos de 4 jugadores usando Snake Seeding y asigna mesas iniciales.
 */
export async function generateGroups(tournamentId: string) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("No autorizado");
    }

    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId }
        });

        if (!tournament) throw new Error("Torneo no encontrado");

        // Limpieza previa
        await prisma.tournamentGroup.deleteMany({ where: { tournamentId } });
        await prisma.match.deleteMany({ where: { tournamentId } });

        // Obtener 32 jugadores válidos
        const registrations = await prisma.tournamentRegistration.findMany({
            where: { 
                tournamentId, 
                OR: [
                    { status: "APPROVED" },
                    { paymentStatus: "PAID" }
                ],
                isWaitingList: false
            },
            include: {
                player: {
                    include: {
                        rankings: { where: { discipline: tournament.discipline } }
                    }
                }
            },
            orderBy: { registeredPoints: 'desc' },
            take: 32
        });

        if (registrations.length < 32) {
            throw new Error(`Se requieren 32 jugadores (hay ${registrations.length}).`);
        }

        // Snake Seeding : 8 grupos de 4
        const groups: any[][] = Array.from({ length: 8 }, () => []);
        let forward = true;
        let groupIdx = 0;

        for (let i = 0; i < 32; i++) {
            groups[groupIdx].push(registrations[i]);
            
            if (forward) {
                if (groupIdx === 7) forward = false;
                else groupIdx++;
            } else {
                if (groupIdx === 0) forward = true;
                else groupIdx--;
            }
        }

        // Crear Grupos y Partidos iniciales en DB
        for (let i = 0; i < 8; i++) {
            const groupName = `GRUPO ${String.fromCharCode(65 + i)}`;
            const dbGroup = await prisma.tournamentGroup.create({
                data: {
                    tournamentId,
                    name: groupName
                }
            });

            // Creamos solo el primer match de cada grupo para la simulación inicial (Table 1-8)
            const p1 = groups[i][0];
            const p2 = groups[i][3]; // Simplificado: 1 vs 4 en el snake

            await prisma.match.create({
                data: {
                    tournamentId,
                    groupId: dbGroup.id,
                    round: 1,
                    matchOrder: 1,
                    tableNumber: (i + 1).toString(),
                    homePlayerId: p1.playerId,
                    awayPlayerId: p2.playerId,
                    homeTarget: p1.player.rankings[0]?.handicapTarget ?? 15,
                    awayTarget: p2.player.rankings[0]?.handicapTarget ?? 15
                }
            });
        }

        return { success: true, groupsGenerated: 8, playersDistributed: 32 };

    } catch (error: any) {
        console.error("Error generating groups:", error);
        return { success: false, error: error.message || "Error al generar grupos." };
    }
}

import { revalidatePath } from "next/cache";

/**
 * Genera el cuadro de eliminación directa (Playoffs) a partir de los resultados
 * de la fase de grupos. 
 * Regla estándar: Clasifican los 2 mejores de cada grupo.
 */
export async function generatePlayoffsFromGroups(tournamentId: string) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("No autorizado");
    }

    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                groups: {
                    include: {
                        matches: true,
                        registrations: { select: { playerId: true } }
                    }
                }
            }
        });

        if (!tournament) throw new Error("Torneo no encontrado");
        if (tournament.groups.length === 0) throw new Error("No hay grupos configurados para este torneo.");

        // 1. Calcular clasificados por grupo
        const winners: any[] = []; // Los que quedaron 1º
        const runnersUp: any[] = []; // Los que quedaron 2º

        for (const group of tournament.groups) {
            const playerIds = group.registrations.map(r => r.playerId);
            const standings = calculateStandings(group.matches, playerIds);
            
            if (standings.length >= 1) winners.push(standings[0]);
            if (standings.length >= 2) runnersUp.push(standings[1]);
        }

        // 2. Ordenar ganadores entre sí y segundos entre sí para sembrar
        // Esto premia al mejor 1º contra el "peor" 2º (si el bracket lo permite)
        const sortedWinners = winners.sort((a, b) => {
            if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
            return b.generalAverage - a.generalAverage;
        });

        const sortedRunnersUp = runnersUp.sort((a, b) => {
            if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
            return b.generalAverage - a.generalAverage;
        });

        // Lista final de siembra: [1st_1, 1st_2, ..., 1st_8, 2nd_1, 2nd_2, ..., 2nd_8]
        const qualifiedPlayers = [...sortedWinners, ...sortedRunnersUp];

        if (qualifiedPlayers.length < 2) {
            throw new Error("No hay suficientes jugadores clasificados para generar un cuadro.");
        }

        const numPlayers = qualifiedPlayers.length;
        
        // Calcular potencia de 2 (ej: 16 si hay 8 grupos x 2 clasificados)
        let bracketSize = 1;
        while (bracketSize < numPlayers) {
            bracketSize *= 2;
        }

        // 3. Eliminar llaves previas QUE NO SEAN DE GRUPOS
        await prisma.match.deleteMany({
            where: { 
                tournamentId,
                groupId: null 
            }
        });

        const seeds = getButterflySeeds(bracketSize);
        const matchesToCreate = [];
        const totalMatches = bracketSize / 2;

        for (let i = 0; i < totalMatches; i++) {
            const seedHome = seeds[i * 2];
            const seedAway = seeds[i * 2 + 1];

            const homeStats = qualifiedPlayers[seedHome - 1]; 
            const awayStats = qualifiedPlayers[seedAway - 1];

            // Buscar targets de hándicap
            const homeRanking = homeStats ? await prisma.ranking.findFirst({
                where: { playerId: homeStats.playerId, discipline: tournament.discipline }
            }) : null;
            const awayRanking = awayStats ? await prisma.ranking.findFirst({
                where: { playerId: awayStats.playerId, discipline: tournament.discipline }
            }) : null;

            matchesToCreate.push({
                tournamentId,
                round: 1,
                matchOrder: i + 1,
                homePlayerId: homeStats?.playerId ?? null,
                awayPlayerId: awayStats?.playerId ?? null,
                homeTarget: homeRanking?.handicapTarget ?? 15,
                awayTarget: awayRanking?.handicapTarget ?? 15,
                isWO: homeStats && !awayStats,
                winnerId: (homeStats && !awayStats) ? homeStats.playerId : null
            });
        }

        await prisma.match.createMany({
            data: matchesToCreate
        });

        revalidatePath(`/tournaments/${tournamentId}/cuadros`);

        return { 
            success: true, 
            bracketSize, 
            qualifiedCount: qualifiedPlayers.length,
            message: `Cuadro de ${bracketSize} generado con ${qualifiedPlayers.length} clasificados.`
        };

    } catch (error: any) {
        console.error("Error generating playoffs:", error);
        return { success: false, error: error.message || "Error al generar eliminatorias." };
    }
}
