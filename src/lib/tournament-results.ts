import prisma from "@/lib/prisma";

export async function getTournamentPodium(tournamentId: string) {
    // 1. Obtener todos los partidos del torneo con los jugadores
    const matches = await prisma.match.findMany({
        where: { tournamentId, isWO: false },
        include: {
            homePlayer: { include: { user: true, club: true } },
            awayPlayer: { include: { user: true, club: true } }
        },
        orderBy: { round: 'desc' }
    });

    if (!matches || matches.length === 0) {
        return null;
    }

    // 2. Identificar la ronda más alta (La Final)
    const maxRound = matches[0].round;
    const finalMatches = matches.filter(m => m.round === maxRound);
    
    // Asumimos que la final es el ultimo partido jugado
    // (En torneos de doble eliminación podría ser distinto, pero usamos estándar 1 final)
    const finalMatch = finalMatches[0];

    if (!finalMatch || !finalMatch.winnerId) {
        return null; // El torneo no tiene ganador o no ha terminado
    }

    // 3. Determinar Campeón (1°) y Subcampeón (2°)
    const championId = finalMatch.winnerId;
    const champion = finalMatch.homePlayerId === championId ? finalMatch.homePlayer : finalMatch.awayPlayer;
    const runnerUp = finalMatch.homePlayerId === championId ? finalMatch.awayPlayer : finalMatch.homePlayer;

    // 4. Determinar los Terceros Lugares (Bronce)
    // Son los perdedores de la ronda inmediatamente anterior a la final (Max Round - 1)
    const semiFinals = matches.filter(m => m.round === maxRound - 1);
    
    const bronzes = [];
    for (const semi of semiFinals) {
        if (semi.winnerId) {
            const loser = semi.homePlayerId === semi.winnerId ? semi.awayPlayer : semi.homePlayer;
            if (loser) {
                // Validación para no meter byes (null)
                // Usamos any para agilizar el mapeo
                bronzes.push(loser as any); 
            }
        }
    }

    return {
        champion: champion as any,
        runnerUp: runnerUp as any,
        bronzes: bronzes
    };
}

export async function getTournamentStandings(tournamentId: string) {
    const registrations = await prisma.tournamentRegistration.findMany({
        where: { tournamentId },
        include: {
            player: {
                include: {
                    user: true,
                    club: true
                }
            }
        },
        orderBy: { registeredRank: 'asc' }
    });

    const fromRegistrations = registrations
        .filter(r => r.registeredRank && r.registeredRank > 0)
        .map(r => ({
            id: r.id,
            name: r.player.user?.name || "Jugador Desconocido",
            rank: r.registeredRank || 0,
            handicap: (r as any).registeredHandicap || 30,
            club: r.player.club?.name || "Independiente"
        }));

    if (fromRegistrations.length > 0) return fromRegistrations;

    // Fallback: derive final positions from knockout bracket results
    return getStandingsFromBracket(tournamentId);
}

async function getStandingsFromBracket(tournamentId: string) {
    const knockoutMatches = await prisma.match.findMany({
        where: { tournamentId, groupId: null },
        include: {
            homePlayer: { include: { user: true, club: true } },
            awayPlayer: { include: { user: true, club: true } }
        }
    });

    if (knockoutMatches.length === 0) return [];

    const playedKnockout = knockoutMatches.filter(
        m => m.winnerId && m.homePlayerId && m.awayPlayerId
    );
    if (playedKnockout.length === 0) return [];

    // All matches (group + knockout) for per-player stats
    const allMatches = await prisma.match.findMany({
        where: { tournamentId },
        select: {
            homePlayerId: true, awayPlayerId: true,
            homeScore: true, awayScore: true,
            homeInnings: true, awayInnings: true,
            homeHighRun: true, awayHighRun: true
        }
    });

    const statsMap: Record<string, {
        totalCaroms: number; totalInnings: number;
        highRun: number; particularAvg: number;
    }> = {};

    const init = (id: string) => {
        if (!statsMap[id]) statsMap[id] = { totalCaroms: 0, totalInnings: 0, highRun: 0, particularAvg: 0 };
    };

    allMatches.forEach(m => {
        if (!m.homePlayerId || !m.awayPlayerId || m.homeScore === null) return;
        init(m.homePlayerId); init(m.awayPlayerId);

        const h = statsMap[m.homePlayerId];
        h.totalCaroms  += m.homeScore || 0;
        h.totalInnings += m.homeInnings || 0;
        if ((m.homeHighRun || 0) > h.highRun) h.highRun = m.homeHighRun || 0;
        const hpa = m.homeInnings ? (m.homeScore || 0) / m.homeInnings : 0;
        if (hpa > h.particularAvg) h.particularAvg = hpa;

        const a = statsMap[m.awayPlayerId];
        a.totalCaroms  += m.awayScore || 0;
        a.totalInnings += m.awayInnings || 0;
        if ((m.awayHighRun || 0) > a.highRun) a.highRun = m.awayHighRun || 0;
        const apa = m.awayInnings ? (m.awayScore || 0) / m.awayInnings : 0;
        if (apa > a.particularAvg) a.particularAvg = apa;
    });

    const maxRound = Math.max(...playedKnockout.map(m => m.round));
    const playerName = (p: any) =>
        p?.user?.name || `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Jugador";
    const playerClub = (p: any) => p?.club?.name || "Independiente";

    const buildStats = (id: string | null) => {
        const s = id ? statsMap[id] : null;
        return {
            generalAverage:    s && s.totalInnings > 0 ? parseFloat((s.totalCaroms / s.totalInnings).toFixed(3)) : 0,
            highRun:           s?.highRun || 0,
            particularAverage: s ? parseFloat(s.particularAvg.toFixed(3)) : 0,
        };
    };

    type Entry = { id: string; name: string; baseRank: number; club?: string; generalAverage: number; highRun: number; particularAverage: number; };

    // Collect entries grouped by base rank (all eliminated in same round share a base rank)
    const byBaseRank: Record<number, Entry[]> = {};

    const addEntry = (id: string, player: any, baseRank: number) => {
        if (!byBaseRank[baseRank]) byBaseRank[baseRank] = [];
        byBaseRank[baseRank].push({ id, name: playerName(player), baseRank, club: playerClub(player), ...buildStats(id) });
    };

    playedKnockout.forEach(m => {
        const winnerPlayer = m.homePlayerId === m.winnerId ? m.homePlayer : m.awayPlayer;
        const loserPlayer  = m.homePlayerId === m.winnerId ? m.awayPlayer  : m.homePlayer;
        const loserId      = m.homePlayerId === m.winnerId ? m.awayPlayerId : m.homePlayerId;
        const loserBase    = m.round === maxRound ? 2 : Math.pow(2, maxRound - m.round) + 1;

        if (m.round === maxRound && m.winnerId) addEntry(m.winnerId, winnerPlayer, 1);
        if (loserId && loserPlayer)             addEntry(loserId, loserPlayer, loserBase);
    });

    // Within each base-rank group, sort by general average desc, then assign sequential positions
    const standings: { id: string; name: string; rank: number; club?: string; generalAverage: number; highRun: number; particularAverage: number; }[] = [];

    for (const [baseStr, group] of Object.entries(byBaseRank)) {
        const base = parseInt(baseStr);
        if (base === 1) {
            standings.push({ ...group[0], rank: 1 });
            continue;
        }
        const sorted = [...group].sort((a, b) => b.generalAverage - a.generalAverage || b.highRun - a.highRun);
        sorted.forEach((entry, i) => standings.push({ ...entry, rank: base + i }));
    }

    return standings;
}

export async function getTournamentStats(tournamentId: string) {
    const matches = await prisma.match.findMany({
        where: { tournamentId, isWO: false },
        include: {
            homePlayer: { include: { user: true } },
            awayPlayer: { include: { user: true } }
        }
    });

    if (!matches || matches.length === 0) return null;

    let bestRun = { value: 0, playerName: "-", playerId: "" };
    let bestAverage = { value: 0, playerName: "-", playerId: "" };

    matches.forEach(m => {
        // High Runs
        if ((m.homeHighRun || 0) > bestRun.value) {
            bestRun = { value: m.homeHighRun!, playerName: m.homePlayer?.user?.name || "Desconocido", playerId: m.homePlayerId || "" };
        }
        if ((m.awayHighRun || 0) > bestRun.value) {
            bestRun = { value: m.awayHighRun!, playerName: m.awayPlayer?.user?.name || "Desconocido", playerId: m.awayPlayerId || "" };
        }

        // Averages
        if (m.homeInnings && m.homeInnings > 0) {
            const avg = m.homeScore! / m.homeInnings;
            if (avg > bestAverage.value) {
                bestAverage = { value: parseFloat(avg.toFixed(3)), playerName: m.homePlayer?.user?.name || "Desconocido", playerId: m.homePlayerId || "" };
            }
        }
        if (m.awayInnings && m.awayInnings > 0) {
            const avg = m.awayScore! / m.awayInnings;
            if (avg > bestAverage.value) {
                bestAverage = { value: parseFloat(avg.toFixed(3)), playerName: m.awayPlayer?.user?.name || "Desconocido", playerId: m.awayPlayerId || "" };
            }
        }
    });

    return {
        bestRun,
        bestAverage
    };
}

export async function checkPlayerIsHighRun(tournamentId: string, playerId: string) {
    const stats = await getTournamentStats(tournamentId);
    if (!stats || stats.bestRun.value === 0) return false;
    return stats.bestRun.playerId === playerId;
}

export async function getGroupStandings(tournamentId: string) {
    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                matches: {
                    where: { groupId: { not: null } },
                    include: {
                        homePlayer: { include: { user: true } },
                        awayPlayer: { include: { user: true } }
                    }
                },
                registrations: {
                    where: { status: 'APPROVED' },
                    include: {
                        player: { include: { user: true } }
                    }
                }
            }
        });

        if (!tournament) return { success: false, error: "Torneo no encontrado" };

        const playerIds = tournament.registrations.map(r => r.playerId);
        const playerNames: Record<string, string> = {};
        tournament.registrations.forEach(r => {
            playerNames[r.playerId] = r.player.user?.name || "Sin Nombre";
        });

        const stats: Record<string, any> = {};
        playerIds.forEach(id => {
            stats[id] = {
                playerId: id,
                playerName: playerNames[id],
                matchPoints: 0,
                totalCaroms: 0,
                totalInnings: 0,
                highRun: 0,
                particularAverage: 0,
                weightedAverage: 0
            };
        });

        tournament.matches.forEach(match => {
            if (!match.homePlayerId || !match.awayPlayerId) return;
            const homeId = match.homePlayerId;
            const awayId = match.awayPlayerId;

            if (match.winnerId === homeId) {
                stats[homeId].matchPoints += 2;
            } else if (match.winnerId === awayId) {
                stats[awayId].matchPoints += 2;
            } else if (match.winnerId === null && (match.homeInnings ?? 0) > 0) {
                stats[homeId].matchPoints += 1;
                stats[awayId].matchPoints += 1;
            }

            stats[homeId].totalCaroms += (match.homeScore || 0);
            stats[homeId].totalInnings += (match.homeInnings || 0);
            if ((match.homeHighRun || 0) > stats[homeId].highRun) stats[homeId].highRun = match.homeHighRun!;

            stats[awayId].totalCaroms += (match.awayScore || 0);
            stats[awayId].totalInnings += (match.awayInnings || 0);
            if ((match.awayHighRun || 0) > stats[awayId].highRun) stats[awayId].highRun = match.awayHighRun!;
        });

        const standings = Object.values(stats).map(s => ({
            ...s,
            weightedAverage: s.totalInnings > 0 ? s.totalCaroms / s.totalInnings : 0
        })).sort((a, b) => {
            if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
            if (b.weightedAverage !== a.weightedAverage) return b.weightedAverage - a.weightedAverage;
            return b.highRun - a.highRun;
        });

        return { success: true, standings };
    } catch (error: any) {
        console.error("Error in getGroupStandings:", error);
        return { success: false, error: error.message };
    }
}
