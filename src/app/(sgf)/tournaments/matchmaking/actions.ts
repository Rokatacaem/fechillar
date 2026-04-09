"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function generateBrackets(tournamentId: string) {
    const session = await auth();
    // Verificación de acceso
    if (!session || !session.user) {
        throw new Error("No autorizado");
    }

    try {
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
                ]
            },
            orderBy: { registeredPoints: 'desc' }
        });

        if (registrations.length < 2) {
            throw new Error("Se necesitan al menos 2 jugadores válidos para generar llaves.");
        }

        const numPlayers = registrations.length;
        
        // Calcular potencia de 2 más cercana hacia arriba (2, 4, 8, 16, 32...)
        let bracketSize = 1;
        while (bracketSize < numPlayers) {
            bracketSize *= 2;
        }

        // Sembrado Estándar: Generar un array de semillas [1, 2, 3... bracketSize]
        // y ordenarlas en la forma de cruce (Siembra protegida)
        // Por simplicidad en implementaciones iniciales, usamos emparejamiento directo Extremos:
        // Match 1: Seed 1 vs Seed N (o Bye)
        // Match 2: Seed 2 vs Seed N-1
        // Para bracketSizes fijos existe un orden estándar (1-16, 8-9, etc.), pero usaremos aproximación lineal 
        // para asegurar que los mejores no se crucen de inmediato (Top vs Bottom del pool).

        const matchesToCreate = [];
        const totalMatches = bracketSize / 2;

        for (let i = 0; i < totalMatches; i++) {
            const seedHome = i + 1;
            const seedAway = bracketSize - i;

            const homePlayer = registrations[seedHome - 1]; // Índices 0-based
            const awayPlayer = registrations[seedAway - 1];

            matchesToCreate.push({
                tournamentId,
                round: 1,
                matchOrder: i + 1,
                // Si el jugador de "casa" no existe (cosa rara en top seeding), bye.
                homePlayerId: homePlayer ? homePlayer.playerId : (awayPlayer ? awayPlayer.playerId : "ERROR"), 
                // Si el jugador away no existe (ej: 3 inscritos, bracket de 4, semilla 4 es nula), es un BYE
                awayPlayerId: awayPlayer ? awayPlayer.playerId : null,
                isWO: !awayPlayer, // Si no hay oponente, avanza por W.O / Bye
                winnerId: !awayPlayer && homePlayer ? homePlayer.playerId : null
            });
        }

        // Filtrar aquellos donde homePlayer sea ERROR accidentalmente (bracketSize mayor muy extremo)
        const validMatches = matchesToCreate.filter(m => m.homePlayerId !== "ERROR");

        await prisma.match.createMany({
            data: validMatches
        });

        return { success: true, bracketSize, generatedMatches: validMatches.length };

    } catch (error: any) {
        console.error("Error generating brackets:", error);
        return { success: false, error: error.message || "Error interno al generar cuadros." };
    }
}

export async function submitMatchResult(matchId: string, homeScore: number, awayScore: number) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("No autorizado");
    }

    try {
        const match = await prisma.match.findUnique({ where: { id: matchId }});
        if (!match) throw new Error("Match no encontrado");

        let winnerId = null;
        if (homeScore > awayScore) winnerId = match.homePlayerId;
        else if (awayScore > homeScore) winnerId = match.awayPlayerId;

        // Actualizar el partido actual
        const updatedMatch = await prisma.match.update({
            where: { id: matchId },
            data: {
                homeScore,
                awayScore,
                winnerId
            }
        });

        // ============================================
        // PROPAGAR GANADOR A SIGUIENTE RONDA
        // ============================================
        if (winnerId) {
            const nextRound = match.round + 1;
            const nextMatchOrder = Math.ceil(match.matchOrder / 2);
            const isHome = match.matchOrder % 2 !== 0;

            // Busca si ya se ha generado el placeholder param para la sig ronda
            const nextMatch = await prisma.match.findFirst({
                where: {
                    tournamentId: match.tournamentId,
                    round: nextRound,
                    matchOrder: nextMatchOrder
                }
            });

            if (nextMatch) {
                // Actualizar match existente
                await prisma.match.update({
                    where: { id: nextMatch.id },
                    data: isHome ? { homePlayerId: winnerId } : { awayPlayerId: winnerId }
                });
            } else {
                // Generar match vacío a la espera del contrincante
                await prisma.match.create({
                    data: {
                        tournamentId: match.tournamentId,
                        round: nextRound,
                        matchOrder: nextMatchOrder,
                        homePlayerId: isHome ? winnerId : "TBD", // TBD como bandera temporal que exige actualización
                        awayPlayerId: isHome ? null : winnerId
                    }
                });
            }
        }

        return { success: true, winnerId };

    } catch (error: any) {
        console.error("Propagation error:", error);
        return { success: false, error: "Error en la validación y propagación del bracket." };
    }
}
