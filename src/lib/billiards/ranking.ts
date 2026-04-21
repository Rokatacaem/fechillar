import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getPlayerOfficialRanking(playerId: string) {
    // Buscar todos los partidos donde haya participado el jugador 
    // en Torneos Homologados por la Federación Nacional.
    const matches = await prisma.match.findMany({
        where: {
            OR: [
                { homePlayerId: playerId },
                { awayPlayerId: playerId }
            ],
            tournament: {
                scope: "NATIONAL",
                officializationStatus: "APPROVED" // REGLA ORO: Solo contarán eventos oficiales.
            }
        },
        include: {
            tournament: true
        }
    });

    let totalPoints = 0;
    let totalScore = 0;
    let totalInnings = 0;
    
    matches.forEach(match => {
        const isHome = match.homePlayerId === playerId;
        const score = isHome ? (match.homeScore || 0) : (match.awayScore || 0);
        const target = isHome ? (match.homeTarget || 1) : (match.awayTarget || 1);
        const innings = (match.homeInnings || 0); // Asumimos que ambos tienen mismas entradas en billar de carambolas
        
        // Sumar estadísticas de partido
        totalScore += score;
        totalInnings += innings;

        // Reglas estándar de puntuación: si ganó el jugador
        if (match.winnerId === playerId) {
            totalPoints += 3; // 3 pts por Victoria Directa
        } else if (match.winnerId === null && match.innings && match.innings > 0) {
            // Empate
            totalPoints += 1;
        }
    });

    const averageGeneral = totalInnings > 0 ? (totalScore / totalInnings) : 0;

    return {
        playerId,
        officialMatchesPlayed: matches.length,
        rankingPoints: totalPoints,
        totalScore,
        totalInnings,
        generalAverage: averageGeneral.toFixed(3)
    };
}
