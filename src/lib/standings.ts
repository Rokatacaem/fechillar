import prisma from "@/lib/prisma";

export interface GroupStanding {
    playerId: string;
    playerName: string;
    playerPhoto: string | null;
    clubName: string;
    played: number;
    won: number;
    lost: number;
    drawn: number;
    points: number;
    carambolas: number;
    innings: number;
    average: number;
    highRun: number;
}

/**
 * Calcula la tabla de posiciones para un grupo específico.
 */
export async function getGroupStandings(groupId: string): Promise<GroupStanding[]> {
    const group = await prisma.tournamentGroup.findUnique({
        where: { id: groupId },
        include: {
            matches: {
                where: { winnerId: { not: null } }, // Solo partidos terminados
                include: {
                    homePlayer: { include: { user: true, club: true } },
                    awayPlayer: { include: { user: true, club: true } }
                }
            }
        }
    });

    if (!group) return [];

    const statsMap = new Map<string, GroupStanding>();

    const getOrInit = (playerId: string, player: any): GroupStanding => {
        if (!statsMap.has(playerId)) {
            statsMap.set(playerId, {
                playerId,
                playerName: player.user?.name || "Jugador",
                playerPhoto: player.photoUrl,
                clubName: player.club?.name || "Libre",
                played: 0,
                won: 0,
                lost: 0,
                drawn: 0,
                points: 0,
                carambolas: 0,
                innings: 0,
                average: 0,
                highRun: 0
            });
        }
        return statsMap.get(playerId)!;
    };

    for (const match of group.matches) {
        if (!match.homePlayerId || !match.awayPlayerId) continue;

        const home = getOrInit(match.homePlayerId, match.homePlayer);
        const away = getOrInit(match.awayPlayerId, match.awayPlayer);

        home.played++;
        away.played++;

        // Protección de Promedio en WO: No sumar carambolas ni entradas
        if (!match.isWO) {
            home.carambolas += match.homeScore || 0;
            away.carambolas += match.awayScore || 0;
            home.innings += match.homeInnings || 0;
            away.innings += match.awayInnings || 0;
            
            home.highRun = Math.max(home.highRun, match.homeHighRun || 0);
            away.highRun = Math.max(away.highRun, match.awayHighRun || 0);
        }

        if (match.winnerId === match.homePlayerId) {
            home.won++;
            home.points += 2;
            away.lost++;
        } else if (match.winnerId === match.awayPlayerId) {
            away.won++;
            away.points += 2;
            home.lost++;
        } else if (match.winnerId === null && match.homeScore === match.awayScore) {
            home.drawn++;
            away.drawn++;
            home.points += 1;
            away.points += 1;
        }
    }

    // Calcular promedios finales
    const results = Array.from(statsMap.values()).map(s => ({
        ...s,
        average: s.innings > 0 ? parseFloat((s.carambolas / s.innings).toFixed(3)) : 0
    }));

    // Ordenamiento Federado: Puntos -> Duelo Directo (Primer Partido) -> AVG -> High Run
    return results.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        
        // Desempate por Duelo Directo (Prioridad 1 en el Nacional)
        // Buscamos el primer partido entre ellos en este grupo
        const headToHead = group.matches.find(m => 
            (m.homePlayerId === a.playerId && m.awayPlayerId === b.playerId) ||
            (m.homePlayerId === b.playerId && m.awayPlayerId === a.playerId)
        );

        if (headToHead && headToHead.winnerId) {
            if (headToHead.winnerId === a.playerId) return -1;
            if (headToHead.winnerId === b.playerId) return 1;
        }

        if (b.average !== a.average) return b.average - a.average;
        return b.highRun - a.highRun;
    });
}
