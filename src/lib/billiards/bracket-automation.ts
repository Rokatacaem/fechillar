export interface GroupPlayerResult {
    playerId: string;
    groupId: string;
    matchesPlayed: number;
    won: number;
    drawn: number;
    lost: number;
    points: number; // Por victorias (PG)
    totalScorePonderado: number; // Suma Ponderado
    totalInnings: number;
    pgp: number; // Promedio General Ponderado
}

export function calculateGroupBypasses(
    players: GroupPlayerResult[], 
    spotsAvailable: number, 
    bypassCount: number
) {
    // Ordenar jugadores por puntos primero, luego PGP como tiebreak
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        return b.pgp - a.pgp;
    });

    const bypassedPlayers = sortedPlayers.slice(0, bypassCount);
    const adjustmentPlayers = sortedPlayers.slice(bypassCount, spotsAvailable);

    return {
        bypassed: bypassedPlayers,
        adjustmentCrosses: adjustmentPlayers
    };
}
