import { Match, Tournament } from "@prisma/client";

export interface PlayerStats {
    playerId: string;
    matchPoints: number;
    totalCarambolas: number;
    totalInnings: number;
    highRun: number;
    particularAverage: number; // Mejor promedio en una partida
    generalAverage: number;
}

/**
 * Calcula el ranking de un grupo o fase basado en las reglas oficiales de 3 Bandas:
 * 1. Puntos de Match (2 Win, 1 Draw, 0 Loss)
 * 2. Promedio General (PG) = Carambolas Totales / Entradas Totales
 * 3. Serie Mayor (SM)
 * 4. Promedio Particular (PP)
 */
export function calculateStandings(matches: Match[], playerIds: string[]): PlayerStats[] {
    const stats: Record<string, PlayerStats> = {};

    playerIds.forEach(id => {
        stats[id] = {
            playerId: id,
            matchPoints: 0,
            totalCarambolas: 0,
            totalInnings: 0,
            highRun: 0,
            particularAverage: 0,
            generalAverage: 0
        };
    });

    matches.forEach(match => {
        if (!match.homePlayerId || !match.awayPlayerId) return;

        const homeId = match.homePlayerId;
        const awayId = match.awayPlayerId;
        const homeScore = match.homeScore || 0;
        const awayScore = match.awayScore || 0;
        const homeInnings = match.homeInnings || 1;
        const awayInnings = match.awayInnings || 1;
        const homeHighRun = match.homeHighRun || 0;
        const awayHighRun = match.awayHighRun || 0;

        // Puntos de Match
        if (match.winnerId === homeId) {
            stats[homeId].matchPoints += 2;
        } else if (match.winnerId === awayId) {
            stats[awayId].matchPoints += 2;
        } else if (match.winnerId === null && match.homeScore !== null) {
            // Empate (si se jugaron entradas)
            stats[homeId].matchPoints += 1;
            stats[awayId].matchPoints += 1;
        }

        // Estadísticas Home
        stats[homeId].totalCarambolas += homeScore;
        stats[homeId].totalInnings += homeInnings;
        if (homeHighRun > stats[homeId].highRun) stats[homeId].highRun = homeHighRun;
        
        const homePP = homeInnings > 0 ? homeScore / homeInnings : 0;
        if (homePP > stats[homeId].particularAverage) stats[homeId].particularAverage = homePP;

        // Estadísticas Away
        stats[awayId].totalCarambolas += awayScore;
        stats[awayId].totalInnings += awayInnings;
        if (awayHighRun > stats[awayId].highRun) stats[awayId].highRun = awayHighRun;

        const awayPP = awayInnings > 0 ? awayScore / awayInnings : 0;
        if (awayPP > stats[awayId].particularAverage) stats[awayId].particularAverage = awayPP;
    });

    // Calcular Promedio General y ordenar
    const result = Object.values(stats).map(s => ({
        ...s,
        generalAverage: s.totalInnings > 0 ? s.totalCarambolas / s.totalInnings : 0
    }));

    return result.sort((a, b) => {
        // 1. Puntos
        if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
        // 2. Promedio General (PG)
        if (b.generalAverage !== a.generalAverage) return b.generalAverage - a.generalAverage;
        // 3. Serie Mayor (SM)
        if (b.highRun !== a.highRun) return b.highRun - a.highRun;
        // 4. Promedio Particular (PP)
        return b.particularAverage - a.particularAverage;
    });
}
