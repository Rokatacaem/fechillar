"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { evaluateMatchWinner } from "@/lib/billiards/match-engine";
import { getGroupStandings } from "@/lib/tournament-results";
import { revalidatePath } from "next/cache";

/**
 * Obtiene el ranking efectivo para un jugador según el tipo de torneo
 * Prioriza Ranking Anual para torneos sin handicap
 */
function getEffectiveRanking(registration: any) {
  const player = registration.player;
  
  // Priorizar Ranking Anual si existe
  const annualRanking = player.rankings?.find((r: any) => r.discipline === 'THREE_BAND_ANNUAL');
  if (annualRanking && annualRanking.points > 0) {
    return {
      points: annualRanking.points || 0,
      average: annualRanking.average || 0,
      source: 'ANNUAL',
      rankPosition: annualRanking.rankPosition || 999
    };
  }
  
  // Fallback a Ranking Nacional
  const nationalRanking = player.rankings?.find((r: any) => r.discipline === 'THREE_BAND');
  return {
    points: nationalRanking?.points || 0,
    average: nationalRanking?.average || 0,
    source: 'NATIONAL',
    rankPosition: nationalRanking?.rankPosition || 999
  };
}

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
    if (!session?.user?.id) {
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
    if (!session?.user?.id) {
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
 * Genera 18 grupos de 3 jugadores con Snake Seeding por tercios y respeto a turnos.
 */
export async function generateGroups(tournamentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
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

        // Obtener jugadores válidos
        const registrationsRaw = await prisma.tournamentRegistration.findMany({
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
                        rankings: { 
                            where: { 
                                discipline: { 
                                    in: ['THREE_BAND_ANNUAL', 'THREE_BAND']
                                } 
                            } 
                        }
                    }
                }
            }
        });

        if (registrationsRaw.length < 3) {
            throw new Error(`Se requieren al menos 3 jugadores (hay ${registrationsRaw.length}).`);
        }

        // Agregar ranking efectivo a cada registration
        const registrationsWithRanking = registrationsRaw.map(reg => ({
            ...reg,
            effectiveRanking: getEffectiveRanking(reg)
        }));

        // Ordenar por ranking efectivo (puntos > promedio > posición)
        const registrations = registrationsWithRanking.sort((a, b) => {
            if (b.effectiveRanking.points !== a.effectiveRanking.points) return b.effectiveRanking.points - a.effectiveRanking.points;
            if (b.effectiveRanking.average !== a.effectiveRanking.average) return b.effectiveRanking.average - a.effectiveRanking.average;
            return a.effectiveRanking.rankPosition - b.effectiveRanking.rankPosition;
        });

        // 1. LIMITAR A 54 JUGADORES (18 GRUPOS DE 3)
        let mainDraw = registrations.slice(0, 54);
        let overflow = registrations.slice(54);

        // EXCEPCIÓN MANUAL SOLICITADA: Edwin Castillo entra, Víctor Saavedra sale
        const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const victorIdx = mainDraw.findIndex(r => {
            const full = normalize(`${r.player.firstName} ${r.player.lastName}`);
            return full.includes('victor') && full.includes('saavedra');
        });
        
        const edwinIdx = registrations.findIndex(r => {
            const full = normalize(`${r.player.firstName} ${r.player.lastName}`);
            return full.includes('edwin') && full.includes('castillo');
        });

        if (victorIdx !== -1 && edwinIdx !== -1 && edwinIdx >= 54) {
            const victor = mainDraw[victorIdx];
            const edwin = registrations[edwinIdx];
            
            // Intercambiar
            mainDraw[victorIdx] = edwin;
            
            // Re-calcular overflow excluyendo a Edwin (que ya entró) e incluyendo a Víctor
            const others = registrations.filter(r => r.id !== victor.id && r.id !== edwin.id);
            overflow = [victor, ...others.slice(53)]; // 54 - 1 ya asignados
        }

        if (overflow.length > 0) {
            await prisma.tournamentRegistration.updateMany({
                where: { id: { in: overflow.map(r => r.id) } },
                data: { isWaitingList: true, status: 'PENDING' }
            });
        }
        
        // Asegurar que los del mainDraw NO estén en lista de espera
        await prisma.tournamentRegistration.updateMany({
            where: { id: { in: mainDraw.map(r => r.id) } },
            data: { isWaitingList: false, status: 'APPROVED' }
        });

        // Distribución robusta en 3 turnos de 18 jugadores cada uno
        const t1: any[] = [];
        const t2: any[] = [];
        const t3: any[] = [];
        const wildcards: any[] = []; // Jugadores con disponibilidad TOTAL
        const extra: any[] = []; // Excedentes de turnos fijos

        mainDraw.forEach(r => {
            const turn = r.preferredTurn || 'T1'; // Fallback a T1 si es nulo

            if (turn === 'TOTAL') {
                wildcards.push(r);
            } else if (turn === 'T1') {
                if (t1.length < 18) t1.push(r);
                else extra.push(r);
            } else if (turn === 'T2') {
                if (t2.length < 18) t2.push(r);
                else extra.push(r);
            } else if (turn === 'T3') {
                if (t3.length < 18) t3.push(r);
                else extra.push(r);
            } else {
                extra.push(r);
            }
        });

        // 1. Llenar huecos con Wildcards (TOTAL)
        wildcards.forEach(r => {
            const currentTurnos = [t1, t2, t3];
            const minTurno = currentTurnos.reduce((min, t) => t.length < min.length ? t : min);
            if (minTurno.length < 18) {
                minTurno.push(r);
            } else {
                extra.push(r);
            }
        });

        // 2. Llenar huecos restantes con extra (excedentes de turnos fijos que no cabían en su preferido)
        extra.forEach(r => {
            const currentTurnos = [t1, t2, t3];
            const minTurno = currentTurnos.reduce((min, t) => t.length < min.length ? t : min);
            minTurno.push(r);
        });

        const turnos = [t1, t2, t3];

        // FUNCIÓN AUXILIAR: Snake Seeding por tercios
        function snakeSeedByThirds(players: any[], numGroups: number) {
            const groupSize = 3;
            const groups: any[][] = Array.from({ length: numGroups }, () => []);
            
            // Dividir en tercios
            const thirdSize = Math.ceil(players.length / 3);
            const tercio1 = players.slice(0, thirdSize);
            const tercio2 = players.slice(thirdSize, thirdSize * 2);
            const tercio3 = players.slice(thirdSize * 2);

            // Asignar tercio 1 (cabezas de serie) - Snake
            let forward = true;
            let groupIdx = 0;
            tercio1.forEach((player) => {
                groups[groupIdx].push(player);
                if (forward) {
                    if (groupIdx === numGroups - 1) forward = false;
                    else groupIdx++;
                } else {
                    if (groupIdx === 0) forward = true;
                    else groupIdx--;
                }
            });

            // Asignar tercio 2 - Snake inverso
            forward = false;
            groupIdx = numGroups - 1;
            tercio2.forEach((player) => {
                groups[groupIdx].push(player);
                if (forward) {
                    if (groupIdx === numGroups - 1) forward = false;
                    else groupIdx++;
                } else {
                    if (groupIdx === 0) forward = true;
                    else groupIdx--;
                }
            });

            // Asignar tercio 3 - Snake normal
            forward = true;
            groupIdx = 0;
            tercio3.forEach((player) => {
                groups[groupIdx].push(player);
                if (forward) {
                    if (groupIdx === numGroups - 1) forward = false;
                    else groupIdx++;
                } else {
                    if (groupIdx === 0) forward = true;
                    else groupIdx--;
                }
            });

            return groups;
        }

        // Generar grupos por turno con Snake Seeding
        const groupPromises = [];
        let groupCounter = 0;

        for (let turnoIdx = 0; turnoIdx < 3; turnoIdx++) {
            const turnoPlayers = turnos[turnoIdx];
            const numGroups = 6; // 6 grupos por turno
            
            // Definir horario según turno
            const schedules = ["10:00 hrs", "13:00 hrs", "18:00 hrs"];
            const currentSchedule = schedules[turnoIdx];

            // Aplicar Snake Seeding por tercios
            const turnoGroups = snakeSeedByThirds(turnoPlayers, numGroups);

            for (let g = 0; g < numGroups; g++) {
                const groupName = String.fromCharCode(65 + groupCounter);
                const groupPlayers = turnoGroups[g];

                // Crear grupo con horario
                const groupPromise = prisma.tournamentGroup.create({
                    data: {
                        tournamentId,
                        name: `GRUPO ${groupName} (${currentSchedule})`,
                        order: groupCounter + 1,
                        tieBreakType: 'PGP'
                    }
                }).then(async (dbGroup) => {
                    // Actualizar registros
                    await Promise.all(
                        groupPlayers.map((player, idx) =>
                            prisma.tournamentRegistration.update({
                                where: { id: player.id },
                                data: { 
                                    groupId: dbGroup.id,
                                    groupOrder: idx + 1
                                }
                            })
                        )
                    );

                    // Crear partidos Round Robin
                    if (groupPlayers.length >= 2) {
                        const matches = [];
                        const p1 = groupPlayers[0];
                        const p2 = groupPlayers[1];
                        const p3 = groupPlayers[2];

                        if (p3) {
                            matches.push({
                                tournamentId,
                                groupId: dbGroup.id,
                                round: 1,
                                matchOrder: 1,
                                homePlayerId: p1.playerId,
                                awayPlayerId: p3.playerId,
                                homeTarget: 25,
                                awayTarget: 25,
                                matchDistance: 25
                            });
                        }

                        matches.push({
                            tournamentId,
                            groupId: dbGroup.id,
                            round: 1,
                            matchOrder: 2,
                            homePlayerId: p1.playerId,
                            awayPlayerId: p2.playerId,
                            homeTarget: 25,
                            awayTarget: 25,
                            matchDistance: 25
                        });

                        if (p3) {
                            matches.push({
                                tournamentId,
                                groupId: dbGroup.id,
                                round: 1,
                                matchOrder: 3,
                                homePlayerId: p3.playerId,
                                awayPlayerId: p2.playerId,
                                homeTarget: 25,
                                awayTarget: 25,
                                matchDistance: 25
                            });
                        }

                        await prisma.match.createMany({ data: matches });
                    }
                });

                groupPromises.push(groupPromise);
                groupCounter++;
            }
        }

        await Promise.all(groupPromises);

        return { 
            success: true, 
            groupsGenerated: 18,
            playersDistributed: mainDraw.length,
            waitingListMoved: overflow.length,
            distribution: {
                T1: turnos[0].length,
                T2: turnos[1].length,
                T3: turnos[2].length
            }
        };

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
/**
 * Genera el cuadro de eliminación directa (Playoffs) a partir de los resultados
 * de la fase de grupos y la fase de ajuste.
 * Objetivo: Cuadro de 32 (16vos de Final).
 */
export async function generatePlayoffsFromGroups(tournamentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
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

        // 1. Obtener clasificados directos de grupos (Top 28)
        const allClassified: any[] = [];
        for (const group of tournament.groups) {
            const playerIds = group.registrations.map(r => r.playerId);
            const standings = calculateStandings(group.matches, playerIds);
            if (standings.length >= 1) allClassified.push(standings[0]);
            if (standings.length >= 2) allClassified.push(standings[1]);
        }

        // Ordenar todos para sacar el corte de 28
        const sortedAll = allClassified.sort((a, b) => {
            if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
            if (b.generalAverage !== a.generalAverage) return b.generalAverage - a.generalAverage;
            return b.totalCaroms - a.totalCaroms;
        });

        const top28 = sortedAll.slice(0, 28);

        // 2. Obtener ganadores de la Fase de Ajuste (Barrage)
        const adjustmentMatches = await prisma.match.findMany({
            where: { 
                tournamentId, 
                groupId: null,
                round: 0 // Usamos round 0 para ajuste
            }
        });

        const adjustmentWinners = adjustmentMatches
            .filter(m => m.winnerId !== null)
            .map(m => ({ playerId: m.winnerId, isAdjustmentWinner: true }));

        if (adjustmentWinners.length < adjustmentMatches.length && adjustmentMatches.length > 0) {
            throw new Error("Aún hay partidos de ajuste pendientes.");
        }

        // 3. Combinar para formar los 32
        const final32 = [...top28, ...adjustmentWinners];

        if (final32.length < 2) {
            throw new Error("No hay suficientes jugadores para el cuadro.");
        }

        // Forzar tamaño de cuadro a 32 (o la potencia de 2 superior a los clasificados)
        let bracketSize = 32;
        if (final32.length > 32) bracketSize = 64;
        else if (final32.length <= 16) bracketSize = 16;

        // 4. Eliminar llaves previas QUE NO SEAN DE GRUPOS NI DE AJUSTE
        await prisma.match.deleteMany({
            where: {
                tournamentId,
                groupId: null,
                round: { gt: 0 } // Eliminar rondas 1, 2, 3...
            }
        });

        const seeds = getButterflySeeds(bracketSize);
        const matchesToCreate = [];
        const totalMatches = bracketSize / 2;

        for (let i = 0; i < totalMatches; i++) {
            const seedHome = seeds[i * 2];
            const seedAway = seeds[i * 2 + 1];

            const homeStats = final32[seedHome - 1];
            const awayStats = final32[seedAway - 1];

            // Buscar targets de hándicap
            const homeRanking = homeStats ? await prisma.ranking.findFirst({
                where: { playerId: homeStats.playerId, discipline: tournament.discipline }
            }) : null;
            const awayRanking = awayStats ? await prisma.ranking.findFirst({
                where: { playerId: awayStats.playerId, discipline: tournament.discipline }
            }) : null;

            matchesToCreate.push({
                tournamentId,
                round: 1, // Ronda 1 de eliminación directa (16vos)
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
            qualifiedCount: final32.length,
            message: `Cuadro de ${bracketSize} generado con ${final32.length} clasificados.`
        };

    } catch (error: any) {
        console.error("Error generating playoffs:", error);
        return { success: false, error: error.message || "Error al generar eliminatorias." };
    }
}

/**
 * Genera la Fase de Ajuste para puestos 17-32.
 * Los top 16 pasan directo a 32avos.
 */
export async function generateAdjustmentPhase(tournamentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("No autorizado");
    }

    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                groups: {
                    include: {
                        matches: true,
                        registrations: {
                            include: {
                                player: {
                                    include: {
                                        rankings: { where: { discipline: 'THREE_BAND' } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!tournament) throw new Error("Torneo no encontrado");
        if (tournament.groups.length === 0) throw new Error("No hay grupos configurados.");

        // 1. Calcular clasificados (2 por grupo)
        const allClassified: any[] = [];

        for (const group of tournament.groups) {
            const playerIds = group.registrations.map(r => r.playerId);
            const standings = calculateStandings(group.matches, playerIds);

            // Tomar los 2 primeros
            if (standings.length >= 1) {
                allClassified.push({ ...standings[0], groupName: group.name });
            }
            if (standings.length >= 2) {
                allClassified.push({ ...standings[1], groupName: group.name });
            }
        }

        if (allClassified.length < 16) {
            throw new Error(`Se necesitan al menos 16 clasificados (hay ${allClassified.length}).`);
        }

        // 2. Ordenar clasificados por: Puntos de Partido → PGP → Carambolas
        const sortedClassified = allClassified.sort((a, b) => {
            if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
            if (b.generalAverage !== a.generalAverage) return b.generalAverage - a.generalAverage;
            return b.totalCaroms - a.totalCaroms;
        });

        // 3. Top 28 → DIRECTO (Para cuadro de 32)
        const directClassified = sortedClassified.slice(0, 28);
        console.log('✅ Top 28 clasifican DIRECTO a 16avos de Final (Cuadro de 32)');

        // 4. Puestos 29-36 → AJUSTE (4 partidos de repechaje / Barrage)
        const adjustmentPlayers = sortedClassified.slice(28, 36);

        if (adjustmentPlayers.length < 2) {
            console.log('⚠️ No hay suficientes jugadores para fase de ajuste');
            return {
                success: true,
                directClassified: directClassified.length,
                adjustmentMatches: 0,
                message: 'Solo hay clasificados directos.'
            };
        }

        // Crear TournamentPhase para AJUSTE
        // Eliminamos fases de ajuste previas para este torneo
        await prisma.tournamentPhase.deleteMany({
            where: { tournamentId, name: 'AJUSTE' }
        });

        const adjustmentPhase = await prisma.tournamentPhase.create({
            data: {
                tournamentId,
                name: 'AJUSTE',
                order: 2,
                hasEqualizingInning: true,
                inningLimit: 30
            }
        });

        // Generar partidos de ajuste (enfrentamiento 29 vs 36, 30 vs 35, etc.)
        const matchesToCreate = [];
        const adjustmentCount = Math.floor(adjustmentPlayers.length / 2);

        for (let i = 0; i < adjustmentCount; i++) {
            const homePlayer = adjustmentPlayers[i];
            const awayPlayer = adjustmentPlayers[adjustmentPlayers.length - 1 - i];

            matchesToCreate.push({
                tournamentId,
                phaseId: adjustmentPhase.id,
                round: 0, // Round 0 indica Fase de Ajuste previa al bracket
                matchOrder: i + 1,
                homePlayerId: homePlayer.playerId,
                awayPlayerId: awayPlayer.playerId,
                homeTarget: 25,
                awayTarget: 25,
                matchDistance: 25
            });
        }

        await prisma.match.createMany({
            data: matchesToCreate
        });

        return {
            success: true,
            directClassified: directClassified.length,
            adjustmentMatches: matchesToCreate.length,
            message: `${directClassified.length} clasificados directos, ${matchesToCreate.length} partidos de ajuste generados.`
        };

    } catch (error: any) {
        console.error("Error generating adjustment phase:", error);
        return { success: false, error: error.message || "Error al generar fase de ajuste." };
    }
}

/**
 * Función auxiliar: Calcular tabla de posiciones de un grupo
 */
function calculateStandings(matches: any[], playerIds: string[]) {
    const stats: any = {};

    // Inicializar stats
    playerIds.forEach(pid => {
        stats[pid] = {
            playerId: pid,
            matchPoints: 0,
            totalCaroms: 0,
            totalInnings: 0,
            generalAverage: 0
        };
    });

    // Procesar partidos
    matches.forEach(match => {
        if (!match.winnerId || !match.homePlayerId || !match.awayPlayerId) return;

        const homeId = match.homePlayerId;
        const awayId = match.awayPlayerId;

        // Puntos de partido
        if (match.winnerId === homeId) {
            stats[homeId].matchPoints += 2;
        } else if (match.winnerId === awayId) {
            stats[awayId].matchPoints += 2;
        } else {
            // Empate
            stats[homeId].matchPoints += 1;
            stats[awayId].matchPoints += 1;
        }

        // Carambolas y entradas
        stats[homeId].totalCaroms += match.homeScore || 0;
        stats[homeId].totalInnings += match.homeInnings || 0;
        stats[awayId].totalCaroms += match.awayScore || 0;
        stats[awayId].totalInnings += match.awayInnings || 0;
    });

    // Calcular promedios
    Object.values(stats).forEach((s: any) => {
        s.generalAverage = s.totalInnings > 0 ? s.totalCaroms / s.totalInnings : 0;
    });

    // Ordenar
    return Object.values(stats).sort((a: any, b: any) => {
        if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
        if (b.generalAverage !== a.generalAverage) return b.generalAverage - a.generalAverage;
        return b.totalCaroms - a.totalCaroms;
    });
}
/**
 * Acción crítica: Cierra la fase de grupos y genera automáticamente la Fase de Ajuste (Barrage).
 */
export async function closeGroupPhase(tournamentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("No autorizado");
    }

    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                groups: {
                    include: {
                        matches: true
                    }
                }
            }
        });

        if (!tournament) throw new Error("Torneo no encontrado");

        // 1. Validar que todos los partidos de grupo estén terminados
        const allMatches = tournament.groups.flatMap(g => g.matches);
        const pendingMatches = allMatches.filter(m => m.winnerId === null && !m.isWO);
        
        if (pendingMatches.length > 0) {
            return { 
                success: false, 
                error: `Aún quedan ${pendingMatches.length} partidos pendientes en la fase de grupos.` 
            };
        }

        // 2. Ejecutar generación de Fase de Ajuste (Barrage)
        // Esta función ya calcula el ranking y selecciona los 29-36
        const adjustmentResult = await generateAdjustmentPhase(tournamentId);
        
        if (!adjustmentResult.success) {
            return adjustmentResult;
        }

        revalidatePath(`/tournaments/${tournamentId}/grupos`);
        revalidatePath(`/tournaments/${tournamentId}/ajuste`);

        return {
            success: true,
            message: "Fase de grupos cerrada con éxito. Fase de Ajuste (Barrage) generada.",
            details: adjustmentResult.message
        };

    } catch (error: any) {
        console.error("Error in closeGroupPhase:", error);
        return { success: false, error: error.message || "Error al cerrar la fase de grupos." };
    }
}

/**
 * Genera la fase de eliminación directa (Knockout) de forma flexible.
 * @param tournamentId ID del torneo
 * @param qCount Cantidad de clasificados (ej: 16, 32)
 * @param customPlayerIds Lista opcional de IDs de jugadores clasificados (Modo Auditoría)
 */
export async function generateKnockoutPhase(tournamentId: string, qCount: number, customPlayerIds?: string[]) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autorizado");

    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId }
        });
        if (!tournament) throw new Error("Torneo no encontrado");

        let classifiedIds: string[] = [];

        if (customPlayerIds && customPlayerIds.length > 0) {
            // MODO AUDITORÍA: Usamos la lista exacta enviada desde el UI
            classifiedIds = customPlayerIds.slice(0, qCount);
        } else {
            // MODO AUTOMÁTICO: Calculamos standings globales de grupos
            const res = await getGroupStandings(tournamentId);
            if (!res.success) throw new Error(res.error);
            classifiedIds = res.standings.slice(0, qCount).map((s: any) => s.playerId);
        }

        if (classifiedIds.length < 2) throw new Error("Se necesitan al menos 2 clasificados.");

        // Determinar tamaño de bracket (Potencia de 2)
        let bracketSize = 2;
        while (bracketSize < qCount) bracketSize *= 2;

        // Limpiar llaves previas
        await prisma.match.deleteMany({
            where: { tournamentId, groupId: null, round: { gt: 0 } }
        });

        const seeds = getButterflySeeds(bracketSize);
        const matchesToCreate = [];
        const totalMatches = bracketSize / 2;

        for (let i = 0; i < totalMatches; i++) {
            const seedHome = seeds[i * 2];
            const seedAway = seeds[i * 2 + 1];

            const homeId = classifiedIds[seedHome - 1] || null;
            const awayId = classifiedIds[seedAway - 1] || null;

            // Obtener targets de hándicap si hay jugador
            let homeTarget = 15;
            let awayTarget = 15;

            if (homeId) {
                const hR = await prisma.ranking.findFirst({ where: { playerId: homeId, discipline: tournament.discipline } });
                homeTarget = hR?.handicapTarget ?? 15;
            }
            if (awayId) {
                const aR = await prisma.ranking.findFirst({ where: { playerId: awayId, discipline: tournament.discipline } });
                awayTarget = aR?.handicapTarget ?? 15;
            }

            matchesToCreate.push({
                tournamentId,
                round: 1,
                matchOrder: i + 1,
                homePlayerId: homeId,
                awayPlayerId: awayId,
                homeTarget,
                awayTarget,
                isWO: !!(homeId && !awayId),
                winnerId: (homeId && !awayId) ? homeId : null
            });
        }

        await prisma.match.createMany({ data: matchesToCreate });

        revalidatePath(`/tournaments/${tournamentId}/cuadros`);
        return { success: true, bracketSize };

    } catch (error: any) {
        console.error("Error in generateKnockoutPhase:", error);
        return { success: false, error: error.message };
    }
}
