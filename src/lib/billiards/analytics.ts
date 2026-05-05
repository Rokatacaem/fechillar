import { PrismaClient } from "@prisma/client";
import { WEIGHTING_TABLE } from "./constants";

const prisma = new PrismaClient();

export async function getPlayerPerformanceMetrics(playerId: string) {
    const matches = await prisma.match.findMany({
        where: {
            OR: [{ homePlayerId: playerId }, { awayPlayerId: playerId }]
        }
    });

    let totalScore = 0;
    let totalInnings = 0;
    let maxSeries = 0;

    matches.forEach(m => {
        const isHome = m.homePlayerId === playerId;
        totalScore += isHome ? (m.homeScore || 0) : (m.awayScore || 0);
        totalInnings += isHome ? (m.homeInnings || 0) : (m.awayInnings || 0);
        const hr = isHome ? (m.homeHighRun || 0) : (m.awayHighRun || 0);
        if (hr > maxSeries) maxSeries = hr;
    });

    const average = totalInnings > 0 ? (totalScore / totalInnings) : 0;
    // Serie Promedio: ¿Qué promedia cuando NO falla inmediatamente? Asumiremos simple Promedio aquí
    
    return {
        average: average.toFixed(3),
        highRun: maxSeries,
        totalScore,
        totalInnings
    };
}

export async function getPGPTrend(playerId: string) {
    const matches = await prisma.match.findMany({
        where: {
            OR: [{ homePlayerId: playerId }, { awayPlayerId: playerId }],
            status: "FINISHED"
        },
        orderBy: { createdAt: "asc" },
        take: 20
    });

    return matches.map(m => {
        const isHome = m.homePlayerId === playerId;
        const score = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
        const target = isHome ? (m.homeTarget || m.matchDistance || 1) : (m.awayTarget || m.matchDistance || 1);
        const innings = isHome ? (m.homeInnings || 1) : (m.awayInnings || 1);
        
        const factor = WEIGHTING_TABLE[target] || 1.0;
        const ponderado = score * factor;
        const pgp = ponderado / innings;
        const pgReal = score / innings;

        return {
            date: m.createdAt.toISOString().split("T")[0],
            pgp: parseFloat(pgp.toFixed(3)),
            pgReal: parseFloat(pgReal.toFixed(3))
        };
    });
}

export async function getHeadToHead(player1Id: string, player2Id: string) {
    const matches = await prisma.match.findMany({
        where: {
            OR: [
                { homePlayerId: player1Id, awayPlayerId: player2Id },
                { homePlayerId: player2Id, awayPlayerId: player1Id }
            ]
        }
    });

    let p1Wins = 0, p2Wins = 0, draws = 0;
    let p1HR = 0, p2HR = 0;

    matches.forEach(m => {
        if (m.winnerId === player1Id) p1Wins++;
        else if (m.winnerId === player2Id) p2Wins++;
        else draws++;

        const isHomeP1 = m.homePlayerId === player1Id;
        const hr1 = isHomeP1 ? (m.homeHighRun || 0) : (m.awayHighRun || 0);
        const hr2 = isHomeP1 ? (m.awayHighRun || 0) : (m.homeHighRun || 0);

        if (hr1 > p1HR) p1HR = hr1;
        if (hr2 > p2HR) p2HR = hr2;
    });

    return {
        totalMatches: matches.length,
        p1Wins, p2Wins, draws,
        p1HR, p2HR
    };
}

/** REVERSE-ENGINEERING DEL AUDIT LOG PARA CHARTS AVANZADOS */
export async function getAdvancedLogAnalytics(playerId: string) {
    // Buscamos partidos recientes del jugador
    const matches = await prisma.match.findMany({
        where: { OR: [{ homePlayerId: playerId }, { awayPlayerId: playerId }] },
        select: { id: true, homePlayerId: true }
    });

    const matchIds = matches.map(m => m.id);
    if (matchIds.length === 0) return { distribution: {}, heatmap: { T1: 0, T2: 0, T3: 0 } };

    // Filtramos los logs que corresponden a las mesas donde jugó.
    // OJO: Asumimos que los payloads incluyen 'player' (HOME / AWAY).
    const logs = await prisma.auditLog.findMany({
        where: {
            targetId: { in: matchIds },
             OR: [
                { action: { contains: "addPoint" } },
                { action: { contains: "endInning" } },
                { action: { contains: "score_add" } },
                { action: { contains: "miss" } }
            ]
        },
        orderBy: { createdAt: "asc" }
    });

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let totalInningsAnalyzed = 0;
    let t1Score = 0, t2Score = 0, t3Score = 0;

    // AGRUPAMOS LOGS POR PARTIDO PARA AISLAR INNINGS
    const logsByMatch = logs.reduce((acc, log) => {
        const id = log.targetId!;
        if (!acc[id]) acc[id] = [];
        acc[id].push(log);
        return acc;
    }, {} as Record<string, typeof logs>);

    Object.keys(logsByMatch).forEach(matchId => {
        const matchInfo = matches.find(m => m.id === matchId);
        const isPlayerHome = matchInfo?.homePlayerId === playerId;
        const targetLabel = isPlayerHome ? 'HOME' : 'AWAY'; // Para cruzar con el details

        let currentRun = 0;
        const inningsArray: number[] = [];

        logsByMatch[matchId].forEach(log => {
            // Buscamos si la acción fue a favor de nuestro jugador
            let isActionForPlayer = true; // Por defecto tratamos de inferir
            try {
                const parsed = JSON.parse(log.details || "{}");
                // Si el log guarda un "player", validamos. 
                if (parsed.context?.player && parsed.context.player !== targetLabel) {
                   isActionForPlayer = false; 
                }
            } catch(e) {}

            if (isActionForPlayer) {
                if (log.action.includes('addPoint') || log.action.includes('score_add')) {
                    currentRun++;
                } else if (log.action.includes('endInning') || log.action.includes('miss')) {
                    if (currentRun > 0) {
                        distribution[currentRun] = (distribution[currentRun] || 0) + 1;
                    }
                    inningsArray.push(currentRun);
                    currentRun = 0;
                }
            }
        });

        // HEATMAP LOGIC
        totalInningsAnalyzed += inningsArray.length;
        const thirdLength = Math.ceil(inningsArray.length / 3);
        
        inningsArray.forEach((run, idx) => {
            if (idx < thirdLength) t1Score += run;
            else if (idx < thirdLength * 2) t2Score += run;
            else t3Score += run;
        });
    });

    return {
        distribution, 
        heatmap: {
            T1: t1Score, T2: t2Score, T3: t3Score
        },
        totalInningsAnalyzed
    };
}
