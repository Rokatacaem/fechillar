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

    return registrations
        .filter(r => r.registeredRank && r.registeredRank > 0)
        .map(r => ({
            id: r.id,
            name: r.player.user.name || "Jugador Desconocido",
            rank: r.registeredRank || 0,
            handicap: (r as any).registeredHandicap || 30,
            club: r.player.club?.name || "Independiente"
        }));
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
